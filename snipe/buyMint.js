const initializer = require("../lib/initializer");
const swap = require("../lib/swap");

const exec = async () => {
  const data = await initializer({ type: 'Mint' });
  const {
    DEBUG,
  } = process.env;

  let detected = false;

  if (!!parseInt(DEBUG)) {
    console.log("--- debug buyMint ---");
    console.log({
      tokenAddressTo: data.tokenAddressTo,
    });
    process.exit(1);
  }

  console.log('Start subscribe pair mint...');
  data.pair.on('Mint', async (_sender, _amount0, _amount1) => {
    if (detected) {
      console.log("Second mint event detected");
      return;
    }
    detected = true;

    console.log('💡💡💡💡💡💡💡💡💡 Got event pair mint 💡💡💡💡💡💡💡💡💡');

    await swap({
      tokenFrom: data.tokenAddressFrom,
      tokenTo: data.tokenAddressTo,
      tokenBase: data.tokenAddressBase,
      amountIn: data.amountIn,
      walletAddress: data.walletAddress,
      signature: data.signature,
    });
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
