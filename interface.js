const SmartMeterSimulator = require('./simulator');
const config = require('./config');
const Web3 = require('web3');

// Initialize Web3 and accounts
const web3 = new Web3(config.blockchain.provider);

async function runSimulation() {
  console.log("Starting smart meter simulation...");
  
  // Get available accounts (from Ganache)
  const accounts = await web3.eth.getAccounts();
  
  // Create and initialize meters
  const meters = [];
  for (let i = 0; i < config.simulation.meterCount; i++) {
    const type = config.simulation.types[Math.floor(Math.random() * config.simulation.types.length)];
    const meterId = `${type}-${i.toString().padStart(3, '0')}`;
    
    const meter = new SmartMeterSimulator(
      accounts[i + 1], // Skip first account (utility company)
      '0xPRIVATE_KEY', // In real use, load from secure storage
      meterId
    );
    
    try {
      await meter.initialize();
      meters.push(meter);
      console.log(`Initialized meter ${meterId} at ${meter.address.substring(0, 8)}...`);
    } catch (error) {
      console.error(`Failed to initialize meter ${meterId}:`, error.message);
    }
  }
  
  console.log(`\nSimulation running with ${meters.length} active meters`);
  console.log("Press Ctrl+C to stop\n");
  
  // Periodically log balances
  setInterval(async () => {
    console.log("\n=== Current Meter Balances ===");
    for (const meter of meters) {
      const balance = await meter.getBalance();
      console.log(`${meter.meterId}: ${balance} kWh`);
    }
  }, 60000); // Every minute
}

runSimulation().catch(console.error);