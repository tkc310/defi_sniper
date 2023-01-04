const ABI = require('../constants/abi');
const loadEnv = require('../lib/loadEnv');
const ethers = require('ethers');
const Web3 = require('web3');

module.exports = async function initializer(args) {
  loadEnv();

  const {
    ADDRESS_FROM,
    ADDRESS_TO,
    ADDRESS_BASE,
    ADDRESS_FACTORY,
    AMOUNT,
    MULTIPLE_AMOUNT,
    PRIVATE_KEY,
    WS_RPC_URL,
    RPC_URL,
  } = process.env;

  // type: ManualBuy | MultipleBuy | ManualSell | Approve | Mint | Swap | PairCreated
  const { type } = args;

  const isHttp = WS_RPC_URL === undefined;
  const rpc = isHttp ? RPC_URL : WS_RPC_URL;

  const web3 = new Web3(rpc);
  const provider = isHttp ?
    new ethers.providers.JsonRpcProvider(RPC_URL) :
    new ethers.providers.WebSocketProvider(WS_RPC_URL);

  const wallet = new ethers.Wallet(PRIVATE_KEY);
  const signature = wallet.connect(provider);
  const { address: walletAddress } = web3.eth.accounts.wallet.add(PRIVATE_KEY);

  const from = type === 'ManualSell' ? ADDRESS_TO : ADDRESS_FROM;
  const to = type === 'ManualSell' ? ADDRESS_FROM : ADDRESS_TO;
  const tokenAddressFrom = web3.utils.toChecksumAddress(from);
  const tokenAddressTo = web3.utils.toChecksumAddress(to);
  const tokenAddressBase = web3.utils.toChecksumAddress(ADDRESS_BASE);
  const amount = type === 'MultipleBuy' ? MULTIPLE_AMOUNT : AMOUNT;
  const amountIn = ethers.utils.parseUnits(amount, 18);

  let factory = null;
  if (!['ManualBuy', 'ManualSell', 'MultipleBuy'].includes(type)) {
    factory = new ethers.Contract(
      ADDRESS_FACTORY,
      ABI.FACTORY,
      signature
    );
  }

  let pair = null;
  if (['Swap', 'Mint'].includes(type)) {
    const pairAddress = await factory.getPair(tokenAddressBase, tokenAddressTo);
    pair = new ethers.Contract(
      pairAddress,
      ABI.PARE,
      signature
    );
  }

  return {
    signature,
    walletAddress,
    tokenAddressFrom,
    tokenAddressTo,
    tokenAddressBase,
    amountIn,
    ethers,
    factory,
    pair,
  }
}
