// @see: https://graphql.bitquery.io/ide#
// https://bitquery.io/blog/graphql-with-python-javascript-and-ruby

const fs = require('fs');
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
  const query = getQuery();
  const url = "https://graphql.bitquery.io/";
  const opts = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": API_KEY_BITQUERY
    },
    body: JSON.stringify({
      query
    })
  };

  const response = await fetch(url, opts);
  const result = await response.json();
  console.log(result);

  const txs = result.data.ethereum.smartContractCalls;
  const outputs = txs.map((tx) => {
    return {
      timestamp: tx.block.timestamp.time,
      tx: tx.transaction.hash,
      wallet: tx.transaction.txFrom.address,
    };
  });
  console.log(outputs);

  const filePath = `${__dirname}/outputs/tx_survey_${FILENAME_SUFFIX}.json`
  fs.writeFile(
    filePath,
    JSON.stringify(outputs, null, '  '),
    (error) => {
      if (error) throw error;
      console.log('--- done ---');
    }
  );
};

exec();

function getQuery() {
  const limit = 50;
  const network = "bsc";
  const dateFormat = "%Y-%m-%d %H:%M:%S";
  const contractMethod = "transferFrom";

  return `query {
    ethereum(network: ${network}) {
      smartContractCalls(
        options: {asc: "block.timestamp.time", limit: ${limit}}
        date: {since: "${DATE_FROM}", till: "${DATE_TO}"}
        smartContractAddress: {is: "${TOKEN}"}
        smartContractMethod: {is: "${contractMethod}"}
      ) {
        block {
          timestamp {
            time(format: "${dateFormat}")
          }
        }
        transaction {
          hash
          # wallet address
          txFrom {
            address
          }
        }
      }
    }
  }`;
}

process.on('unhandledRejection', (error, promise) => {
  console.log(
    '--- Failed ---\n',
    error.message
  );
  process.exit(1);
});
