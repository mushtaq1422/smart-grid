import Web3 from 'web3';
import SmartGridABI from './build/contracts/SmartGrid.json';

class BlockchainService {
  constructor() {
    this.web3 = new Web3(window.ethereum || 'http://localhost:7545');
    this.contractAddress = 'YOUR_CONTRACT_ADDRESS';
    this.contract = new this.web3.eth.Contract(SmartGridABI.abi, this.contractAddress);
    this.utilityAccount = 'UTILITY_ACCOUNT_ADDRESS';
  }

  async initialize() {
    if (window.ethereum) {
      try {
        await window.ethereum.enable();
        this.accounts = await this.web3.eth.getAccounts();
        return true;
      } catch (error) {
        console.error("User denied account access");
        return false;
      }
    }
    return false;
  }

  async registerMeter(meterAddress, ownerAddress) {
    const txData = this.contract.methods.registerMeter(meterAddress, ownerAddress).encodeABI();
    
    const tx = {
      from: this.utilityAccount,
      to: this.contractAddress,
      gas: 500000,
      data: txData
    };
    
    const signedTx = await this.web3.eth.accounts.signTransaction(tx, 'UTILITY_PRIVATE_KEY');
    return await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
  }

  async transferEnergy(fromAddress, fromPrivateKey, toAddress, amount) {
    const txData = this.contract.methods.transferEnergy(toAddress, amount).encodeABI();
    
    const tx = {
      from: fromAddress,
      to: this.contractAddress,
      gas: 500000,
      data: txData
    };
    
    const signedTx = await this.web3.eth.accounts.signTransaction(tx, fromPrivateKey);
    return await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
  }

  async getMeterBalance(meterAddress) {
    const meter = await this.contract.methods.meters(meterAddress).call();
    return meter.balance;
  }

  async getTransactionHistory() {
    const count = await this.contract.methods.getTransactionCount().call();
    const transactions = [];
    
    for (let i = 0; i < count; i++) {
      const tx = await this.contract.methods.getTransaction(i).call();
      transactions.push({
        from: tx.from,
        to: tx.to,
        amount: tx.amount,
        timestamp: new Date(tx.timestamp * 1000)
      });
    }
    
    return transactions;
  }
}

export default new BlockchainService();