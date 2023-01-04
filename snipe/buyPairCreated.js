const initializer = require("../lib/initializer");
const swap = require("../lib/swap");

const exec = async () => {
  const data = await initializer({ type: 'PairCreated' });

  const {
    DEBUG,
  } = process.env;

  // waiting, detected, completed
  let boughtStatus = "waiting";

  if (!!parseInt(DEBUG)) {
    console.log("--- debug buyPairCreated ---");
    console.log({
      tokenAddressTo: data.tokenAddressTo,
    });
    process.exit(1);
  }

  const swapWrap = async () => {
    await swap({
      tokenFrom: data.tokenAddressFrom,
      tokenTo: data.tokenAddressTo,
      tokenBase: data.tokenAddressBase,
      amountIn: data.amountIn,
      walletAddress: data.walletAddress,
      signature: data.signature,
    });
    boughtStatus = "completed";
    process.exit(1);
  };

  console.log('Start subscribe pair create...');
  data.factory.on('PairCreated', async (token0, token1, _pairAddress) => {
    switch (boughtStatus) {
      case "waiting":
        const isMatched = [token0, token1].some(item => item === data.tokenAddressTo);
        const createdToken = [token0, token1].filter((item) => item === data.tokenAddressBase)[0];

        if (isMatched) {
          boughtStatus = "detected";
console.log(`==========================================
New pair detected - 💡💡💡💡💡 Matched 💡💡💡💡💡
------------------------------------------
Token: https://bscscan.com/token/${createdToken}`);
        } else {
console.log(`==========================================
New pair detected - No Matched
------------------------------------------
Token: https://bscscan.com/token/${createdToken}`);
          return;
        }

        await swapWrap();
        break;
      case "detected":
        await swapWrap();
        break;
      case "completed":
        console.log("Your Token was bought!");
        process.exit(1);
      }
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
