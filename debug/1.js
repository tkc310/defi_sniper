const { Worker } = require('worker_threads');
const readUserInput = require('../lib/readUserInput');

const exec = async () => {
  const execCount = await readUserInput('Input to exec count: ');

  [...Array(execCount)].forEach(() => {
    // 並列実行
    const worker = new Worker('./debug/4.js');
  });
};

exec();
