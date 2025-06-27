module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",  // Ganache runs on localhost by default
      port: 7545,         // Default port for Ganache
      network_id: "*"     // Match any network ID (Ganache uses a random network ID)
    }
  },

  compilers: {
    solc: {
      version: "0.8.26",    // Specify the Solidity compiler version
      settings: {           // Optional, can be customized as needed
        optimizer: {
          enabled: true,
          runs: 200
        },
        evmVersion: "istanbul"  // Check this at your side
      }
    }
  }
};

