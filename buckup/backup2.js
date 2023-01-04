require("dotenv").config();
const {
  ADDRESS_FROM,
  ADDRESS_TO,
  ADDRESS_FACTORY,
  AMOUNT,
  PRIVATE_KEY,
  WS_RPC_URL,
} = process.env;
const ethers = require('ethers');
const Web3 = require('web3');
const swap = require("./lib/swap");

const exec = async () => {
    const web3 = new Web3(WS_RPC_URL);
    const provider = new ethers.providers.WebSocketProvider(WS_RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY);
    const signature = wallet.connect(provider);
    const { address: walletAddress } = web3.eth.accounts.wallet.add(PRIVATE_KEY);

    const tokenAddressFrom = web3.utils.toChecksumAddress(ADDRESS_FROM);
    const tokenAddressTo = web3.utils.toChecksumAddress(ADDRESS_TO);
    const amountIn = ethers.utils.parseUnits(AMOUNT, 18);

    const factory = new ethers.Contract(
      ADDRESS_FACTORY,
      ['event PairCreated(address indexed token0, address indexed token1, address pair, uint)'],
      signature
    );
    const contract = new ethers.Contract(
      tokenAddressFrom,
      [
        'function approve(address spender, uint256 amount) external returns (bool)',
        'function balanceOf(address tokenOwner) public view returns (uint balance)',
      ],
      signature
    );

    // waiting, created, completed
    let boughtStatus = "waiting";

    console.log('Start subscribe pair create...');
    factory.on('PairCreated', async (token0, token1, pairAddress) => {
      switch (boughtStatus) {
        case "waiting":
          console.log(`
          ------------------------------------------------------------
          New pair detected - Scanning for Token
          =================
          Token 1 Address : ${token0}
          Token 2 Address: ${token1}
          PairAddress: ${pairAddress}
          `);

          // Check if the new pair is the one looked for
          let tokenFrom, tokenTo;
          if (token0 === tokenAddressTo && token1 === tokenAddressFrom) {
            console.log(`Only first token of Pair is the token expected`);
            tokenFrom = token1;
            tokenTo = token0;
            boughtStatus = "created";
          }

          else if (token1 === tokenAddressTo && token0 === tokenAddressFrom) {
            console.log(`Only second token of Pair is the token expected`);
            tokenFrom = token0;
            tokenTo = token1;
            boughtStatus = "created";
          }

          //The quote currency is not WBNB
          else if (typeof tokenFrom === 'undefined') {
            console.log(`
            No token of the pair is the token expected
            ------------------------------------------------------------
            `);

            // loop out
            return;
          }

          await approve(contract, amountIn);
          await swap({
            tokenFrom,
            tokenTo,
            amountIn,
            walletAddress,
            signature
          });
          boughtStatus = "completed";
          process.exit(1);
        case "created":
          await approve(contract, amountIn);
          await swap({
            tokenFrom: tokenAddressFrom,
            tokenTo: tokenAddressTo,
            amountIn,
            walletAddress,
            signature
          });
          boughtStatus = "completed";
          process.exit(1);
        case "completed":
          console.log("Your Token was bought!");
          process.exit(1);
        }
    });
};

process.on('unhandledRejection', (error, promise) => {
  console.log(
    '--- Failed ---\n',
    error.message
  );
  process.exit(1);
});

exec();
