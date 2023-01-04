const ABI = require('../constants/abi');
const loadEnv = require('../lib/loadEnv');
const ethers = require('ethers');

module.exports = async function swap(args) {
  loadEnv();

  const {
    DEADLINE_MIN,
    ADDRESS_ROUTER,
    TRADE_GAS_LIMIT,
    TRADE_GAS_PRICE,
    DEBUG,
  } = process.env;

  const {
    tokenFrom,
    tokenTo,
    tokenBase,
    amountIn,
    walletAddress,
    signature,
    // option
    swapMethod,
    amountOut,
    amountInMax,
  } = args;

  console.log("Connecting to DEX router...");
  const router = new ethers.Contract(
    ADDRESS_ROUTER,
    ABI.ROUTER,
    signature
  );
  console.log("Connected to DEX router");

  // ignore slippage
  const amountOutMin = 0;
  const deadline = Math.floor(Date.now() / 1000) + 60 * DEADLINE_MIN;
  let path = [tokenFrom, tokenTo];
  // case tokenBase is not wbnb
  if (![tokenFrom, tokenTo].includes(tokenBase)) {
    path = [tokenFrom, tokenBase, tokenTo];
  }

  console.log(`Creating Transaction`);
  if (!!parseInt(DEBUG)) {
    console.log("--- debug swap ---");
    console.log({
      tokenTo,
      tokenFrom,
    });
  } else {
    let tx = null;
    if (swapMethod === 'swapTokensForExactTokens') {
      // @see https://uniswap.org/docs/v2/smart-contracts/router02/#swaptokensforexacttokens
      // swap先トークンの購入数を指定
      tx = await router.swapTokensForExactTokens(
        amountOut,
        amountInMax,
        path,
        walletAddress,
        deadline,
        {
          gasLimit: ethers.utils.hexlify(parseInt(TRADE_GAS_LIMIT)),
          gasPrice: ethers.utils.parseUnits(TRADE_GAS_PRICE, "gwei")
        }
      );
    }
    // else if (swapMethod === 'swapExactTokensForTokensSupportingFeeOnTransferTokens') {
    //   // トークンによっては使えない (トークンが消失する)
    //   // @see: https://uniswap.org/docs/v2/smart-contracts/router02/#swapexacttokensfortokenssupportingfeeontransfertokens
    //   // デフレトークン用の売却メソッド
    //   tx = await router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
    //     amountIn,
    //     amountOutMin,
    //     // 2要素のみ受け付けるためwbnbで固定
    //     [tokenFrom, tokenBase],
    //     walletAddress,
    //     deadline,
    //     {
    //       gasLimit: ethers.utils.hexlify(parseInt(TRADE_GAS_LIMIT)),
    //       gasPrice: ethers.utils.parseUnits(TRADE_GAS_PRICE, "gwei")
    //     }
    //   );
    // }
    else {
      // @see https://uniswap.org/docs/v2/smart-contracts/router02/#swapexacttokensfortokens
      // swap元トークンの購入数を指定 (通常ver)
      tx = await router.swapExactTokensForTokens(
        amountIn,
        amountOutMin,
        path,
        walletAddress,
        deadline,
        {
          gasLimit: ethers.utils.hexlify(parseInt(TRADE_GAS_LIMIT)),
          gasPrice: ethers.utils.parseUnits(TRADE_GAS_PRICE, "gwei")
        }
      );
    }
    console.log(`Tx-hash: https://bscscan.com/tx/${tx.hash}`);
    const receipt = await tx.wait();
    console.log('Order Success 🎉🎉🎉');
    console.log(`Tx was mined in block: ${receipt.blockNumber}`);
  }
}
