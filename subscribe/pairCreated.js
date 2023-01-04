const initializer = require('../lib/initializer');
const ethers = require('ethers');

// used to find unpublished contract addresses from symbols.
const SEARCH_TARGET_SYMBOLS = [
  'SEARCH_TARGET_SYMBOLS',
];

const exec = async () => {
  const data = await initializer({ type: 'PairCreated' });

  const {
    DEBUG,
  } = process.env;

  if (!!parseInt(DEBUG)) {
    console.log("--- debug PairCreated ---");
    console.log({
      tokenAddressTo: data.tokenAddressTo,
    });
    process.exit(1);
  }

  console.log('Start subscribe pair create...');
  data.factory.on('PairCreated', async (token0, token1, pairAddress) => {
    let createdAddress = null;
    if (token0 === data.tokenAddressBase) {
      createdAddress = token1;
    } else {
      createdAddress = token0;
    }
    // ignore base token address (e.g. wbnb)
    getInfo(
      createdAddress,
      data.tokenAddressTo,
      data.signature
    );
  });
};

const getInfo = async (
  createdAddress,
  targetAddress,
  signature
) => {
  const contract = new ethers.Contract(
    createdAddress,
    [
      'function name() view returns (string)',
      'function symbol() view returns (string)',
    ],
    signature
  );

  const name = await contract.name();
  const symbol = await contract.symbol();

  console.log(`name: ${name?.trim()} - symbol: ${symbol?.trim()}`);

  if (SEARCH_TARGET_SYMBOLS.some(item => !!symbol.match(item))) {
console.log(`----------
💡💡💡💡💡 Probably Matched Symbol 💡💡💡💡💡
Symbol: ${symbol?.trim()}
URL: https://bscscan.com/token/${createdAddress}
💡💡💡💡💡💡💡💡💡💡💡💡💡💡💡💡💡💡💡💡💡💡💡💡💡
----------`);
  }

  if (createdAddress === targetAddress) {
console.log(`----------
💡💡💡💡💡 Matched Address 💡💡💡💡💡
URL: https://bscscan.com/token/${createdAddress}
💡💡💡💡💡💡💡💡💡💡💡💡💡💡💡💡💡💡💡💡
----------`);
  }
};

exec();
