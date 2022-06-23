require('@nomiclabs/hardhat-waffle');
require('dotenv').config();
require('solidity-coverage');

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      chainId: 31337
    },
    ropsten: {
      url: process.env.ROPSTEN_INFURA_URL,
      accounts: [process.env.PRIVATE_KEY]
    },
    mumbai: {
      url: 'https://polygon-mumbai.g.alchemy.com/v2/7wragNJgaldMwaWCfPuD78z0-YHF7l4h',
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  solidity: {
    compilers: [
      {
        version:  "0.8.7",
      }
    ]
  }

};
