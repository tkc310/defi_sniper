require("dotenv").config();
const {
  ChainId, Token, TokenAmount, Fetcher, Pair, Route, Trade, TradeType, Percent
} = require('@pancakeswap-libs/sdk');
const ethers = require('ethers');
const fetch = require("node-fetch");

const {
  AMOUNT,
  SLIPPAGE,
  DEADLINE_MIN,
  PRIVATE_KEY,
  ADDRESS_ROUTER
} = process.env;

module.exports = async (args) => {
  const {
    tokenFrom,
    tokenTo,
    amountIn,
    walletAddress,
    signature,
    web3,
    provider
  } = args;

  const [INPUT_TOKEN, OUTPUT_TOKEN] = await Promise.all(
    [tokenFrom, tokenTo].map(tokenAddress => (
      new Token(ChainId.MAINNET, tokenAddress, 18)
  )));

  console.log({
    INPUT_TOKEN,
    OUTPUT_TOKEN,
    amountIn
  });

  const router = new ethers.Contract(
    ADDRESS_ROUTER,
    [
      'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
      'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
    ],
    signature
  );

  // const ONE_ETH_IN_WEI = web3.utils.toBN(web3.utils.toWei('1'));//BN->(BIG NUMBER) || toWei -> Converts any ether value value into wei.
  // const tradeAmount = ONE_ETH_IN_WEI.div(web3.utils.toBN('100'));//tradeAmount = ONE_ETH_IN_WEI/1000
  // const pair = await Fetcher.fetchPairData(INPUT_TOKEN, OUTPUT_TOKEN, provider);
  // const route = await new Route([pair], INPUT_TOKEN);
  // const trade = await new Trade(route, new TokenAmount(INPUT_TOKEN, tradeAmount), TradeType.EXACT_INPUT);
  // const slippageTolerance = new Percent(Slipage, '100');
  // const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw;
  // const amountOutMin = ethers.utils.parseUnits(web3.utils.fromWei(amountOutMin.toString()), 18);
  // const amounts = await router.getAmountsOut(amountIn, [tokenFrom, tokenTo]);
  // const slippage = SLIPPAGE / 10;
  // const amountOutMin = amounts[1].div(slippage);
  const amountOutMin = ethers.utils.parseUnits("100", 18);
  const deadline = Math.floor(Date.now() / 1000) + 60 * DEADLINE_MIN;

  const contract = new ethers.Contract(
    tokenFrom,
    [
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      'function approve(address _spender, uint256 _value) public returns (bool success)',
      'function balanceOf(address) public view returns (uint)',
      'function _maxTxAmount() public view returns (uint256)',
    ],
    signature
  );

  const divNumber = await readUserInput("Input to sell division number (1 to 100%, 2 to 50%): ");
  const balance = await contract.balanceOf(walletAddress);
  const divedBalance = balance.div(divNumber);
  const name = await contract.name();
  const symbol = await contract.symbol();

  console.log({
    amountIn_int: parseInt(amountIn._hex, 16),
    amountIn,
    amountOutMin: parseInt(amountOutMin._hex, 16),
    amounts: {
      busd: parseInt(amounts[0]._hex, 16),
      usdt: parseInt(amounts[1]._hex, 16),
    },
    deadline,
    // gasPrice,
    tokenFrom,
    tokenTo,
    balance_int: parseInt(balance._hex, 16),
    balance,
    divedBalance,
    walletAddress,
    name,
    symbol,
  });
};

async function readUserInput(question) {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve, reject) => {
    readline.question(question, (answer) => {
      const ret = parseInt(answer, 10);
      if (isNaN(ret)) {
        throw("数値を入力してください");
      }
      resolve(ret);
      readline.close();
    });
  });
}

async function getGasPrice(speed) {
  if (speed != 'standard' && speed != 'fast' && speed != 'fastest')
      throw new Error("InvalidArgumentException");
  return await fetch('https://www.etherchain.org/api/gasPriceOracle', { method: 'get' })
  .then(res => res.json())
  .then(json => json[speed].toString());
}

