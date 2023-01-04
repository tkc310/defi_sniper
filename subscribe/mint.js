const initializer = require('../lib/initializer');

const exec = async () => {
  const data = await initializer({ type: 'Mint' });

  const {
    DEBUG,
  } = process.env;

  if (!!parseInt(DEBUG)) {
    console.log("--- debug Mint ---");
    console.log({
      tokenAddressTo: data.tokenAddressTo,
    });
    process.exit(1);
  }

  console.log('Start subscribe pair mint...');
  data.pair.on('Mint', async (address, _sender, _amount0, amount1) => {

console.log(`💡💡💡💡💡💡💡💡💡 Got event pair mint 💡💡💡💡💡💡💡💡💡
Tx: https://bscscan.com/tx/${amount1?.transactionHash}
Address(router): https://bscscan.com/address/${address}`);

  });
};

exec();
