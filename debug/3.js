const initializer = require('../lib/initializer');

const exec = async () => {
  const data = await initializer({ type: 'Mint' });
  const { ADDRESS_ROUTER } = process.env;

  const router = new data.ethers.Contract(
    ADDRESS_ROUTER,
    [
      'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
    ],
    data.signature
  );

  const amountIn = data.ethers.utils.parseUnits('0.025', 18);
  const from = '0xe9e7cea3dedca5984780bafc599bd69add087d56';
  const to = '0x002d8563759f5e1eaf8784181f3973288f6856e4';

  const amounts = await router.getAmountsOut(
    amountIn,
    [
      from,
      data.tokenAddressBase,
      to,
    ]
  );

  console.log({
    test: data.ethers.utils.parseUnits("1", 18),
    test2: amountIn,
    amounts,
    amountsP: [
      parseInt(amounts[0], 10),
      parseInt(amounts[1], 10),
      parseInt(amounts[2], 10),
    ]
  });
};

exec();
