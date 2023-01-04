const initializer = require("../lib/initializer");

const exec = async () => {
  const data = await initializer({ type: 'Approve' });

  const {
    ADDRESS_ROUTER,
    APPROVE_GAS_LIMIT,
    APPROVE_GAS_PRICE,
    DEBUG,
  } = process.env;

  const contract = new data.ethers.Contract(
    data.tokenAddressTo,
    [
      'function approve(address spender, uint256 amount) external returns (bool)',
    ],
    data.signature
  );

  console.log(`Approving on router...`);
  if (!!parseInt(DEBUG)) {
    console.log("debug approve");
    console.log({
      tokenAddressTo: data.tokenAddressTo
    });
  } else {
    const tx = await contract.approve(
      ADDRESS_ROUTER,
      data.ethers.constants.MaxUint256,
      {
        gasLimit: data.ethers.utils.hexlify(parseInt(APPROVE_GAS_LIMIT)),
        gasPrice: data.ethers.utils.parseUnits(APPROVE_GAS_PRICE, "gwei")
      }
    );
    console.log(`Tx-hash: https://bscscan.com/tx/${tx.hash}`);
    await tx.wait();
    console.log(`Approve Success 🎉🎉🎉`);
  }

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
