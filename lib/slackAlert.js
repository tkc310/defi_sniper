const loadEnv = require('../lib/loadEnv');
const fetch = require('node-fetch');

async function slackAlert(message) {
  loadEnv();

  const {
    WEBHOOK_URL
  } = process.env;

  const options = {
    method : "post",
    contentType : "application/json",
    body: JSON.stringify(
      {
        text: message,
        link_names: 1
      }
    )
  };

  // @ts-ignore
  await fetch(WEBHOOK_URL, options);
}

module.exports = slackAlert;
