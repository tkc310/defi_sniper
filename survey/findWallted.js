const fs = require('fs').promises;
const fetch = require('node-fetch');
const dotenv = require('dotenv');

dotenv.config({ path: `./env/.survey` });
const {
  API_KEY_BITQUERY,
  TOKEN,
  DATE_FROM,
  DATE_TO,
  FILENAME_SUFFIX,
} = process.env;

const exec = async () => {
  const symbols = [
    'AS', 'ASTR', 'Bidenance_1', 'BIDENANCE', 'CATFRIES',
    'HS', 'MGIRLS', 'MM', 'MoonWeed', 'NewWorld', 'PQ',
    'SUELON', 'TR', 'WCUM',
  ];
  const files = symbols.map((item) => {
    return {
      symbol: item,
      path: `${__dirname}/outputs/tx_survey_${item}.json`,
    };
  });

  // {
  //   "timestamp": "2021-06-14 20:00:34",
  //   "tx": "xxx",
  //   "wallet": "xxx"
  // }

  const symbolWallets = await getSymbolWallet(files);

  let allWallets = [];
  symbolWallets.forEach((item) => {
    allWallets = allWallets.concat(item.wallets);
  });

  const sameWallets = allWallets.filter((item, idx, self) => {
    return (
      self.indexOf(item) === idx &&
      idx !== self.lastIndexOf(item)
    );
  });

  console.log({
    sameWallets,
    count: sameWallets.length,
  });
};

exec();

async function getSymbolWallet(files) {
  const symbolWallets = [];

  for (let file of files) {
    const data = await fs.readFile(file.path, 'utf-8');
    const json = JSON.parse(data);
    const wallets = json.map((tx) => tx.wallet);

    symbolWallets.push({
      symbol: file.symbol,
      wallets: [...new Set(wallets)],
    });
  }

  return symbolWallets;
}
