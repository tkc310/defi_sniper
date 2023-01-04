const initializer = require("../lib/initializer");
const swap = require("../lib/swap");
const ABI = require('../constants/abi');

/*
 * 購入上限がある場合に利用する
 */
const exec = async () => {
  const data = await initializer({ type: 'Swap' });
  const {
    AMOUNT,
    ADDRESS_ROUTER,
    DEBUG,
  } = process.env;

  if (!!parseInt(DEBUG)) {
    console.log("--- debug buySwapTrace ---");
    console.log({
      tokenAddressTo: data.tokenAddressTo,
    });
    process.exit(1);
  }

  console.log("Connecting to DEX router...");
  const router = new data.ethers.Contract(
    ADDRESS_ROUTER,
    ABI.ROUTER,
    data.signature
  );
  console.log("Connected to DEX router");

  const isBaseWBNB = data.tokenAddressFrom === data.tokenAddressBase;
  // bignum e.g. 0x3635c9adc5dea00000
  let amountWBNBHex = 0;
  if (isBaseWBNB) {
    amountWBNBHex = data.amountIn;
  } else {
    // wbnbの価格に変換
    const path = [
      data.tokenAddressFrom,
      data.tokenAddressBase,
    ];
    const amounts = await router.getAmountsOut(AMOUNT, path);
    amountWBNBHex = amounts[1];
  }

  console.log('Start subscribe pair swap...');

  let detected = false;
  data.pair.on('Swap', async (
    _sender,
    _amount0In,
    amount1In,
    amount0Out,
    _amount1Out,
    _to,
  ) => {
    if (detected) {
      // console.log("Second mint event detected");
      return;
    }
    detected = true;

    console.log('💡💡💡💡💡💡💡💡💡 Got event pair swap 💡💡💡💡💡💡💡💡💡');

    const logAmountOutHex = amount0Out;
    // WBNBを想定しているがBUSDなどの場合もあるため注意 (未対応)
    const logAmountInHex = amount1In;

    // swapログの方が指定したamountより小さいか
    const isTransferLimitOver = logAmountInHex < amountWBNBHex;
    // 小さい場合はswap先トークン数を指定して取引
    const swapMethod = isTransferLimitOver ?
      'swapTokensForExactTokens' :
      'swapExactTokensForTokens';

    await swap({
      tokenFrom: data.tokenAddressFrom,
      tokenTo: data.tokenAddressTo,
      tokenBase: data.tokenAddressBase,
      walletAddress: data.walletAddress,
      signature: data.signature,
      swapMethod,
      amountIn: isTransferLimitOver ? 0 : data.amountIn,
      amountOut: isTransferLimitOver ? logAmountOutHex : 0,
      amountInMax: isTransferLimitOver ? data.amountIn : 0,
    });

    if (isTransferLimitOver) {
      const amountOutE18 = parseInt(logAmountOutHex, 10);
      const amountInMaxE18 = parseInt(data.amountIn, 10);
      const amountOut = amountOutE18 * 1e-18;
      const amountInMax = amountInMaxE18 * 1e-18;
      console.log(`⚡️⚡️⚡️limit order⚡️⚡️⚡️`);
      console.log({
        amountOutE18,
        amountInMaxE18,
        amountOut,
        amountInMax,
      });
    }

    // ひとまず一回で終了
    // TODO: AMOUNTがなくなるまで繰り返せるようにする
    process.exit(1);
  });
};

process.on('unhandledRejection', (error, promise) => {
  console.log(
    '--- Failed ---\n',
    error.message
  );
  process.exit(1);
});

exec();
