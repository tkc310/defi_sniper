const initializer = require("../lib/initializer");
const swap = require('../lib/swap');

const exec = async () => {
  const data = await initializer({ type: 'ManualBuy' });

  await swap({
    tokenFrom: data.tokenAddressFrom,
    tokenTo: data.tokenAddressTo,
    tokenBase: data.tokenAddressBase,
    amountIn: data.amountIn,
    walletAddress: data.walletAddress,
    signature: data.signature,
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
