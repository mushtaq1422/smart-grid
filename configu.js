module.exports = {
  blockchain: {
    provider: "http://127.0.0.1:7545", // Ganache
    contractAddress: "0x123...", // Your deployed contract address
  },
  simulation: {
    meterCount: 10, // Number of meters to simulate
    types: ['RES', 'COM', 'IND'], // Residential, Commercial, Industrial
  }
};