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
      accounts: [process.env.ROPSTEN_PRIVATE_KEY]
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
