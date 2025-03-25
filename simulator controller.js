import BlockchainService from './blockchain-service.js';

class SimulationController {
  constructor() {
    // ... existing constructor code ...
    this.blockchain = BlockchainService;
    this.isBlockchainConnected = false;
    
    // Add blockchain connection button
    this.connectBlockchainBtn = document.createElement('button');
    this.connectBlockchainBtn.className = 'btn btn-outline btn-sm';
    this.connectBlockchainBtn.textContent = 'Connect Blockchain';
    this.connectBlockchainBtn.addEventListener('click', () => this.connectBlockchain());
    document.querySelector('header').appendChild(this.connectBlockchainBtn);
  }

  async connectBlockchain() {
    this.isBlockchainConnected = await this.blockchain.initialize();
    if (this.isBlockchainConnected) {
      this.connectBlockchainBtn.textContent = 'Blockchain Connected';
      this.connectBlockchainBtn.classList.remove('btn-outline');
      this.connectBlockchainBtn.classList.add('btn-secondary');
      console.log('Blockchain connected successfully');
    } else {
      alert('Failed to connect to blockchain. Using simulation mode only.');
    }
  }

  async startSimulation() {
    // ... existing startSimulation code ...
    
    // Register meters on blockchain if connected
    if (this.isBlockchainConnected) {
      for (const meter of this.meters) {
        try {
          await this.blockchain.registerMeter(meter.address, meter.address); // Using address as owner
          console.log(`Registered meter ${meter.id} on blockchain`);
        } catch (error) {
          console.error(`Failed to register meter ${meter.id}:`, error);
          meter.blockchainEnabled = false;
        }
      }
    }
  }

  async simulateEnergyTransfer(sender, recipient, amount) {
    // Update local simulation
    sender.balance -= amount;
    recipient.balance += amount;
    
    // If blockchain connected, execute real transaction
    if (this.isBlockchainConnected && sender.blockchainEnabled !== false) {
      try {
        const tx = await this.blockchain.transferEnergy(
          sender.address,
          'METER_PRIVATE_KEY', // In production, use secure key management
          recipient.address,
          amount
        );
        
        this.addTransaction({
          from: sender.id,
          to: recipient.id,
          amount,
          timestamp: new Date(),
          blockchainTx: tx.transactionHash
        });
        
        return true;
      } catch (error) {
        console.error('Blockchain transfer failed:', error);
        return false;
      }
    } else {
      // Simulated transaction
      this.addTransaction({
        from: sender.id,
        to: recipient.id,
        amount,
        timestamp: new Date(),
        blockchainTx: null
      });
      return true;
    }
  }

  async updateMeterBalances() {
    if (this.isBlockchainConnected) {
      for (const meter of this.meters) {
        if (meter.blockchainEnabled !== false) {
          try {
            meter.balance = await this.blockchain.getMeterBalance(meter.address);
          } catch (error) {
            console.error(`Failed to update balance for ${meter.id}:`, error);
          }
        }
      }
    }
  }

  async loadBlockchainTransactions() {
    if (this.isBlockchainConnected) {
      try {
        const blockchainTxs = await this.blockchain.getTransactionHistory();
        // Merge with simulated transactions
        this.transactions = [
          ...blockchainTxs.map(tx => ({
            from: this.getMeterByAddress(tx.from)?.id || tx.from,
            to: this.getMeterByAddress(tx.to)?.id || tx.to,
            amount: tx.amount,
            timestamp: tx.timestamp,
            blockchainTx: true
          })),
          ...this.transactions.filter(tx => !tx.blockchainTx)
        ];
        this.renderTransactions();
      } catch (error) {
        console.error('Failed to load blockchain transactions:', error);
      }
    }
  }

  getMeterByAddress(address) {
    return this.meters.find(m => m.address === address);
  }

  // ... rest of the existing code ...
}

// Initialize controller
const controller = new SimulationController();