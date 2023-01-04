const initializer = require("../lib/initializer");
const swap = require('../lib/swap');
const readUserInput = require('../lib/readUserInput');

const exec = async () => {
  const data = await initializer({ type: 'ManualSell' });

  const contract = new data.ethers.Contract(
    data.tokenAddressFrom,
    [
      // 'function approve(address spender, uint256 amount) external returns (bool)',
      'function balanceOf(address tokenOwner) public view returns (uint balance)',
    ],
    data.signature
  );
  const divPer = await readUserInput('Input to sell per (1~100): ');
  const divNumber = Math.floor(100 / divPer);
  const balance = await contract.balanceOf(data.walletAddress);
  const divedBalance = balance.div(divNumber);
  // デフレトークン用のメソッド (通常トークンも同様に利用できる)
  const swapMethod = 'swapExactTokensForTokensSupportingFeeOnTransferTokens';

  console.log({
    amount: parseInt(divedBalance, 10) * 1e-18,
  });

  // approveは事前にしておく
  // await approve(contract, divedBalance);
  await swap({
    tokenFrom: data.tokenAddressFrom,
    tokenTo: data.tokenAddressTo,
    tokenBase: data.tokenAddressBase,
    amountIn: divedBalance,
    walletAddress: data.walletAddress,
    signature: data.signature,
    swapMethod,
  });
  process.exit(1);
};

process.on('unhandledRejection', (error, promise) => {
  console.log(
    '--- Failed ---\n',
    error.message
  );
  process.exit(1);
});

exec();
