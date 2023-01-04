const initializer = require("./initializer");
const swap = require('./swap');

module.exports = async function buyAmountIn() {
  const data = await initializer({ type: 'MultipleBuy' });

  await swap({
    tokenFrom: data.tokenAddressFrom,
    tokenTo: data.tokenAddressTo,
    tokenBase: data.tokenAddressBase,
    amountIn: data.amountIn,
    walletAddress: data.walletAddress,
    signature: data.signature,
  });
};
