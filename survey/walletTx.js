// @see: https://graphql.bitquery.io/ide#
// https://bitquery.io/blog/graphql-with-python-javascript-and-ruby

const fetch = require('node-fetch');
const dotenv = require('dotenv');

dotenv.config({ path: `./env/.survey` });
const {
  API_KEY_BITQUERY,
  DATE_FROM_WALLET_TX,
} = process.env;

const exec = async () => {
  const data = getData();

  const results = [];

  for (let wallet of data.wallets) {
    const walletInfo = {
      wallet,
      count: 0,
    };

    for (let token of data.tokens) {
      const fetched = await getResult(token.address, wallet);
      const txs = fetched?.data?.ethereum?.transfers;
      if (txs?.length) {
        txs.forEach((tx) => {
          if (tx.block.timestamp.time <= token.published) {
            walletInfo.count++;
          }
          console.log({
            tx: tx.block.timestamp.time,
            published: token.published,
            bool: tx.block.timestamp.time <= token.published,
          });
        });
      }
    }

    console.log(walletInfo);
    results.push(walletInfo);
  }

  console.log(results);
};

exec();

async function getResult(token, wallet) {
  const query = getQuery(token, wallet);
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

  return result;
}

function getQuery(token, wallet) {
  const network = "bsc";
  const dateFormat = "%Y-%m-%d %H:%M:%S";

  return `query {
    ethereum(network: ${network}) {
      transfers(
        options: {desc: "block.timestamp.time"}
        date: {since: "${DATE_FROM_WALLET_TX}", till: null}
        amount: {gt: 0}
        receiver: {is: "${wallet}"}
        currency: {is: "${token}"}
      ) {
        block {
          timestamp {
            time(format: "${dateFormat}")
          }
        }
        transaction {
          hash
        }
        amount
      }
    }
  }`;
}

function getData() {
  const tokens = [
    {
      address: "0x54d35d08f9b57c822f6705c3efda9f6d75b2bc85",
      published: "2021-06-15 19:00:00",
    },
    {
      address: "0xe77fb3251034d373af1823f7c6a0ea60ba548513",
      published: "2021-06-15 13:00:00",
    },
    {
      address: "0xa2b3358bd06a0f6e5c4ca9cd9a5e28b0958e1b7c",
      published: "2021-06-14 20:00:00",
    },
    {
      address: "0xed58bf7357352ca270e4879cea7050b1d9b2e09d",
      published: "2021-06-14 13:00:00",
    },
    {
      address: "0x7b49f40fcbedea840c443c78153c3b9af9a52d1d",
      published: "2021-06-13 16:00:00",
    },
    {
      address: "0xb73dcbe3ca246df608ecf456307dbe7accb91cde",
      published: "2021-06-12 19:00:00",
    },
    {
      address: "0x0da2e6ca58a6446cb9a82eaa064abb944462355e",
      published: "2021-06-11 19:00:00",
    },
    {
      address: "0x69cf9714a95576adaa52ebef2b14a6b92b024835",
      published: "2021-06-11 13:00:00",
    },
    {
      address: "0x97246af443dcc6fc6358407c203805ab57944708",
      published: "2021-06-11 13:00:00",
    },
    {
      address: "0x97246af443dcc6fc6358407c203805ab57944708",
      published: "2021-06-09 19:00:00",
    },
    {
      address: "0x7b49F40FcbEdEa840C443C78153c3B9Af9a52d1D",
      published: "2021-06-08 19:00:00",
    },
    {
      address: "0xd7ad445ef192e037ed37f7b743dec68f2a11e463",
      published: "2021-06-08 14:00:00",
    },
    {
      address: "0x88E6FC8A5f9933A136b7DB63b4Ae555152487562",
      published: "2021-06-07 19:30:00",
    },
    {
      address: "0xf313e2114ef908922913bf2efcf47d61b83e9e51",
      published: "2021-06-07 19:00:00",
    },
    {
      address: "0x7faebfc975ef277d29c75feadff6dab03e0fa09f",
      published: "2021-06-07 14:00:00",
    },
  ];
  const wallets = [
    // "0xafdff19a145e10cb2cd2091e5da3d397ddee742b",
    // "0xd7a87414a0fe4be90f4b2cc87eece6aaa4e96880",
    // "0xf8ab6ed4f78037b98b27176c61c13f8e19dbc261",
    // "0x925cfdbf4ff272ec17edfef5cd021629de333098",
    "0x9e395036f4e718a9e96bbcb00a8f52a291d14403",
    // "0xfd54d858ec3a645075b37ca834e6403f686981e7",
  ];

  return {
    tokens,
    wallets,
  }
}

process.on('unhandledRejection', (error, promise) => {
  console.log(
    '--- Failed ---\n',
    error.message
  );
  process.exit(1);
});
