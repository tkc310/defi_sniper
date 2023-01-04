const dotenv = require("dotenv");

module.exports = function loadEnv(fileName = 'pancake') {
  dotenv.config();
  dotenv.config({ path: `./env/.${fileName}` });

  console.log(`--- load env ${fileName} ---`);
}
