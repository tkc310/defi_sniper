DeFi用のトレーディングbotです。  
流動性追加のタイミングで素早くトークンを購入できます。  

下記の機能があります↓  
- ハニーポット対策に事前に少額での売買が可能か検証  
- 購入上限額があるトークン対策として直前に成功したトランザクションの内容をコピーして連続で購入 (限度額設定も可能)  
- pancake(BSC), pangolin(AVAX C-Chain)などに対応 (仕組みは大体同じため取引所などのアドレスを変えれば流用可能)  
- BitQueryのAPIを叩いて特定walletのトランザクションを追跡

利用しなくなったため草を生やす目的でコードを公開します。  
以前使っていましたが現在も優位性があるかは分かりませんので、利用は自己責任でお願いします。  
また、無償で公開しているためツールの利用方法に関する問い合わせは受け付けていません。  

---

This is a trading bot for DeFi.  
You can quickly buy tokens when liquidity is added.  

The following functions are available↓  
- Verify whether it is possible to buy and sell small amounts in advance for honeypot measures  
- Purchase of tokens with a purchase limit by copying the contents of the last successful transaction (limits can also be set)  
- Support for pancake(BSC), pangolin(AVAX C-Chain), etc. (The mechanism is almost the same, so it can be used by changing the address of other exchanges, etc.)  - Track specific wallet transactions by hitting BitQuery's API  

I am publishing the code for the purpose of growing grass since I no longer use it.  
I used to use this tool, but I am not sure if it is still superior, so please use it at your own risk.  
Also, I do not accept inquiries about how to use the tool because I am releasing it for free.  

## Environments

- Node.js: 14.9.0
- npm: 6.14.8

We have only tested this on macOS 10.14.6 (mojave), but it should work fine on any environment that can run the above version of Node.js.

## Setup

### 1. install node.js

```
$ /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
$ brew install nodenv
$ nodenv init
$ echo 'export PATH="$HOME/.nodenv/bin:$PATH"' >> ~/.bash_profile
$ echo 'eval "$(nodenv init -)"' >> ~/.bash_profile
$ source ~/.bash_profile
$ nodenv install 14.9.0
```

### 2. npm install

```
$ npm install
```

### 3. setting secret variables

```
$ touch .env
$ vi .env (edit the .env)
```

```.env
# address of the token to be swapped (selling goes the other way)
# address of the swap source (ex. BUSD)
ADDRESS_FROM="0xe9e7cea3dedca5984780bafc599bd69add087d56"
# address of swap to
ADDRESS_TO="0x08037036451c768465369431da5c671ad9b37dbc"

# advanced settings for ordering
AMOUNT=100
SLIPPAGE=90
DEADLINE_MIN=5
TRADE_GAS_LIMIT=500000
TRADE_GAS_PRICE=50
APPROVE_GAS_LIMIT=300000
APPROVE_GAS_PRICE=25

# private key of your wallet address
PRIVATE_KEY=""
# slack, discord, line etc webhook url (option)
WEBHOOK_URL=""
# for debugging (fixed to 0)
DEBUG=0
```

## Usage (editing)

Use different bots for different purposes.

### snipe

This is used when you want to trigger a purchase for additional liquidity.
Basically, use `snipe/buyPairCreated.js`.

```
$ node snipe/buyPairCreated.js
```

For IDO via launchpad agents such as BSCPAD, use `snipe/buyMint.js`.
barkeyswap also uses `snipe/buyMint.js` since the `PairCreated` event may not be issued.

```
$ node snipe/buyMint.js
```

### manual

Use this option when you want to place an order at an arbitrary time.
Buy allows you to set the amount, while sell sells all the tokens you own.
Note that approve is required before placing a sell order.

```
$ node manual/buy.js
```

```
$ node manual/sell.js
```

```
$ node manual/buyApprove.js
```

```
$ node manual/sellApprove.js
```

### subscribe

This is used when you want to detect only the addition of liquidity without placing an order.
Assumed to be used for researching new markets (DEX) and launchpad projects.

```
$ node subscribe/pairCreated.js
```

```
$ node subscribe/mint.js
```

## Basic flow

1. Research the contract address of the token to be fair-launched in advance.
2. Prepare poocoin and other charts using the addresses you have researched.
   https://poocoin.app/tokens/<address here>
3. Enter the contract address in the .env file
4. Start the Snipe bot 5~10 minutes before the scheduled launch and wait.

You need to approve the token for purchase for the first time in the relevant DEX.

```
$ node manual/buyApprove.js
```

```
$ node snipe/buyPairCreated.js
```

5. If you succeed in purchasing it, APPROVE it.

```
$ node manual/sellApprove.js
```

6. Sell at any time (Mostly, 3~4 minutes is optimal)

```
$ node manual/sell.js
```

Because many bots are triggered a little over 5 minutes ago.
