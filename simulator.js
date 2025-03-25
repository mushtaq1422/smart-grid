const Web3 = require('web3');
const config = require('./config');
const SmartGridABI = require('../../build/contracts/SmartGrid.json').abi;

class SmartMeterSimulator {
  constructor(meterAddress, privateKey, meterId) {
    this.web3 = new Web3(config.blockchain.provider);
    this.contract = new this.web3.eth.Contract(SmartGridABI, config.blockchain.contractAddress);
    this.address = meterAddress;
    this.privateKey = privateKey;
    this.meterId = meterId;
    this.consumptionPatterns = this.loadConsumptionPatterns();
    this.currentLoad = 0;
    this.generationCapacity = 0; // For prosumer meters
    this.isProsumer = false;
  }

  loadConsumptionPatterns() {
    // Simulate different consumption profiles
    return {
      residential: {
        base: 0.5, // kW
        variance: 1.5,
        peakHours: [18, 21] // 6PM-9PM
      },
      commercial: {
        base: 5,
        variance: 10,
        peakHours: [9, 17] // 9AM-5PM
      },
      industrial: {
        base: 50,
        variance: 100,
        peakHours: [0, 23] // Runs all day
      }
    };
  }

  async initialize() {
    // Check registration status
    const meterData = await this.contract.methods.meters(this.address).call();
    if (!meterData.isRegistered) {
      throw new Error(`Meter ${this.address} is not registered on the blockchain`);
    }
    
    // Set meter type (consumer/prosumer)
    this.isProsumer = Math.random() > 0.7; // 30% chance of being prosumer
    if (this.isProsumer) {
      this.generationCapacity = Math.random() * 10 + 1; // 1-11 kW capacity
    }
    
    // Start simulation
    this.simulateUsage();
  }

  simulateUsage() {
    // Update load every 15 seconds (simulated real-time)
    setInterval(() => {
      const now = new Date();
      const hour = now.getHours();
      const pattern = this.getCurrentPattern();
      
      // Calculate base load with random variance
      let load = pattern.base + (Math.random() * pattern.variance);
      
      // Apply peak multipliers
      if (pattern.peakHours[0] <= hour && hour < pattern.peakHours[1]) {
        load *= 1.8; // 80% increase during peak
      }
      
      // For prosumers, sometimes generate excess
      if (this.isProsumer && Math.random() > 0.7) {
        const generated = Math.random() * this.generationCapacity;
        load = -generated; // Negative load means generation
      }
      
      this.currentLoad = parseFloat(load.toFixed(2));
      console.log(`Meter ${this.meterId} | Load: ${this.currentLoad} kW`);
      
      // Automatically transact if significant surplus
      if (this.isProsumer && load < -2.0) {
        this.sellExcessEnergy(Math.abs(load));
      }
    }, 15000); // 15 seconds
  }

  getCurrentPattern() {
    // Determine which consumption pattern to use
    if (this.meterId.includes('RES')) return this.consumptionPatterns.residential;
    if (this.meterId.includes('COM')) return this.consumptionPatterns.commercial;
    if (this.meterId.includes('IND')) return this.consumptionPatterns.industrial;
    return this.consumptionPatterns.residential; // Default
  }

  async sellExcessEnergy(amount) {
    try {
      // Find a meter to sell to (in a real system, this would be a market mechanism)
      const allMeters = await this.getRegisteredMeters();
      const consumerMeters = allMeters.filter(m => m !== this.address);
      
      if (consumerMeters.length > 0) {
        const buyer = consumerMeters[Math.floor(Math.random() * consumerMeters.length)];
        console.log(`Prosumer ${this.meterId} selling ${amount} kWh to ${buyer.substring(0, 8)}...`);
        
        const txData = this.contract.methods.transferEnergy(buyer, amount).encodeABI();
        const tx = {
          from: this.address,
          to: config.blockchain.contractAddress,
          gas: 300000,
          data: txData
        };
        
        const signedTx = await this.web3.eth.accounts.signTransaction(tx, this.privateKey);
        const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        
        console.log(`Transaction successful: ${receipt.transactionHash}`);
        return receipt;
      }
    } catch (error) {
      console.error('Energy sale failed:', error.message);
    }
  }

  async getRegisteredMeters() {
    // This would be more efficient with events in a production system
    const events = await this.contract.getPastEvents('MeterRegistered', {
      fromBlock: 0,
      toBlock: 'latest'
    });
    
    return events.map(e => e.returnValues.meterAddress);
  }

  async getBalance() {
    const meter = await this.contract.methods.meters(this.address).call();
    return meter.balance;
  }
}

module.exports = SmartMeterSimulator;