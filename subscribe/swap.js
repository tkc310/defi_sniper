const initializer = require('../lib/initializer');

const exec = async () => {
  const data = await initializer({ type: 'Swap' });

  const {
    DEBUG,
  } = process.env;

  if (!!parseInt(DEBUG)) {
    console.log("--- debug Swap ---");
    console.log({
      tokenAddressTo: data.tokenAddressTo,
    });
    process.exit(1);
  }

  // let detectedLiquidity = false;

  console.log('Start subscribe pair swap...');
  data.pair.on('Swap', async (
    sender,
    amount0In,
    amount1In,
    amount0Out,
    amount1Out,
    to,
  ) => {
    // if (detectedLiquidity) {
    //   return;
    // }
    // detectedLiquidity = true;

    console.log('💡💡💡💡💡💡💡💡💡 Got event pair swap 💡💡💡💡💡💡💡💡💡');
    console.log({
      sender,
      amount0In,
      amount1In,
      amount0Out,
      amount1Out,
      to,
    });
  });
};

exec();
