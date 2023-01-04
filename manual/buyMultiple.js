const buy = require('../lib/buyAmountIn.js');
const readUserInput = require('../lib/readUserInput');

const exec = async () => {
  const execCount = await readUserInput('Input to exec count: ');

  let left = execCount;
  while (left > 0) {
    await buy();
    left--;
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
