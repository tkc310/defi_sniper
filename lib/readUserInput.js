module.exports = async function readUserInput(question) {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    readline.question(question, (answer) => {
      const ret = parseInt(answer, 10);
      if (isNaN(ret)) {
        throw("数値を入力してください");
      } else if (ret < 1) {
        throw("1~100の数値を入力してください");
      }
      resolve(ret);
      readline.close();
    });
  });
}
