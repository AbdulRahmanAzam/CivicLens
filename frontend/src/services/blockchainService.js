/**
 * Blockchain Service - Ethers.js Integration for CivicLens
 * Connects to Sepolia testnet and interacts with ComplaintTracker contract
 */

import { ethers } from 'ethers';

// Default contract info (will be overridden by deployed contract)
const DEFAULT_CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';
const SEPOLIA_RPC_URL = import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org';
const SEPOLIA_CHAIN_ID = 11155111;

// Contract ABI (essential functions only for frontend)
const CONTRACT_ABI = [
  // Events
  "event ComplaintRegistered(string indexed complaintId, uint256 timestamp, string category, bytes32 hashedDetails, address registeredBy)",
  "event StatusUpdated(string indexed complaintId, uint8 oldStatus, uint8 newStatus, uint256 timestamp, address updatedBy)",
  
  // Read functions
  "function getComplaint(string calldata _complaintId) external view returns (string memory complaintId, uint256 timestamp, string memory category, bytes32 hashedDetails, uint8 currentStatus, bool exists)",
  "function getComplaintHistory(string calldata _complaintId) external view returns (tuple(uint8 oldStatus, uint8 newStatus, uint256 timestamp, bytes32 transactionHash)[] memory)",
  "function getTotalComplaints() external view returns (uint256)",
  "function getAllComplaints(uint256 _offset, uint256 _limit) external view returns (string[] memory)",
  "function statusToString(uint8 _status) external pure returns (string memory)",
  "function getStatusHistoryCount(string calldata _complaintId) external view returns (uint256)",
  
  // Write functions
  "function registerComplaint(string calldata _complaintId, uint256 _timestamp, string calldata _category, bytes32 _hashedDetails) external",
  "function updateStatus(string calldata _complaintId, uint8 _newStatus, uint256 _timestamp) external",
];

// Status enum mapping
const STATUS_ENUM = {
  0: 'Pending',
  1: 'Under Review',
  2: 'In Progress',
  3: 'Resolved',
  4: 'Rejected',
  5: 'Closed',
};

const STATUS_TO_NUMBER = {
  'pending': 0,
  'under_review': 1,
  'in_progress': 2,
  'resolved': 3,
  'rejected': 4,
  'closed': 5,
};

class BlockchainService {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.signer = null;
    this.isConnected = false;
    this.contractAddress = DEFAULT_CONTRACT_ADDRESS;
  }

  /**
   * Initialize the blockchain service with read-only provider
   */
  async initialize() {
    try {
      // Create read-only provider for Sepolia
      this.provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
      
      // Wait for network to be ready
      await this.provider.getNetwork();
      
      if (this.contractAddress) {
        this.contract = new ethers.Contract(
          this.contractAddress,
          CONTRACT_ABI,
          this.provider
        );
      }
      
      this.isConnected = true;
      console.log('✅ Blockchain service initialized (read-only)');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize blockchain service:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Connect with MetaMask for write operations
   */
  async connectWallet() {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Create Web3 provider
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await web3Provider.getSigner();
      
      // Check network
      const network = await web3Provider.getNetwork();
      if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
        // Request network switch
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }], // Sepolia chain ID in hex
          });
        } catch (switchError) {
          // If network doesn't exist, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0xaa36a7',
                chainName: 'Sepolia Testnet',
                nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://rpc.sepolia.org'],
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              }],
            });
          } else {
            throw switchError;
          }
        }
      }

      // Create contract with signer
      if (this.contractAddress) {
        this.contract = new ethers.Contract(
          this.contractAddress,
          CONTRACT_ABI,
          this.signer
        );
      }

      const address = await this.signer.getAddress();
      console.log('✅ Wallet connected:', address);
      return { success: true, address };
    } catch (error) {
      console.error('❌ Failed to connect wallet:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Set contract address (for dynamic configuration)
   */
  setContractAddress(address) {
    this.contractAddress = address;
    if (this.provider) {
      this.contract = new ethers.Contract(
        address,
        CONTRACT_ABI,
        this.signer || this.provider
      );
    }
  }

  /**
   * Register a complaint on the blockchain
   */
  async registerComplaint(complaintId, timestamp, category, details) {
    try {
      if (!this.contract || !this.signer) {
        throw new Error('Contract not initialized or wallet not connected');
      }

      // Hash the details for privacy
      const hashedDetails = ethers.keccak256(
        ethers.toUtf8Bytes(JSON.stringify(details))
      );

      console.log('📝 Registering complaint on blockchain:', complaintId);
      
      const tx = await this.contract.registerComplaint(
        complaintId,
        timestamp,
        category,
        hashedDetails
      );

      console.log('⏳ Transaction submitted:', tx.hash);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      
      console.log('✅ Transaction confirmed:', receipt.hash);
      
      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      console.error('❌ Failed to register complaint:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update complaint status on the blockchain
   */
  async updateStatus(complaintId, newStatus, timestamp) {
    try {
      if (!this.contract || !this.signer) {
        throw new Error('Contract not initialized or wallet not connected');
      }

      const statusNumber = typeof newStatus === 'string' 
        ? STATUS_TO_NUMBER[newStatus.toLowerCase()] ?? 0
        : newStatus;

      console.log('📝 Updating status on blockchain:', complaintId, '->', STATUS_ENUM[statusNumber]);
      
      const tx = await this.contract.updateStatus(
        complaintId,
        statusNumber,
        timestamp
      );

      console.log('⏳ Transaction submitted:', tx.hash);
      
      const receipt = await tx.wait();
      
      console.log('✅ Transaction confirmed:', receipt.hash);
      
      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      console.error('❌ Failed to update status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get complaint details from blockchain
   */
  async getComplaint(complaintId) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const result = await this.contract.getComplaint(complaintId);
      
      return {
        success: true,
        data: {
          complaintId: result[0],
          timestamp: Number(result[1]),
          category: result[2],
          hashedDetails: result[3],
          currentStatus: STATUS_ENUM[result[4]],
          statusCode: Number(result[4]),
          exists: result[5],
        },
      };
    } catch (error) {
      console.error('❌ Failed to get complaint:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get complaint status history from blockchain
   */
  async getComplaintHistory(complaintId) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const history = await this.contract.getComplaintHistory(complaintId);
      
      return {
        success: true,
        data: history.map((update, index) => ({
          index,
          oldStatus: STATUS_ENUM[update[0]],
          newStatus: STATUS_ENUM[update[1]],
          timestamp: Number(update[2]),
          date: new Date(Number(update[2]) * 1000).toISOString(),
        })),
      };
    } catch (error) {
      console.error('❌ Failed to get complaint history:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get total number of complaints on blockchain
   */
  async getTotalComplaints() {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const total = await this.contract.getTotalComplaints();
      return { success: true, total: Number(total) };
    } catch (error) {
      console.error('❌ Failed to get total complaints:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all complaints from blockchain (paginated)
   */
  async getAllComplaints(offset = 0, limit = 50) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const complaintIds = await this.contract.getAllComplaints(offset, limit);
      
      // Fetch details for each complaint
      const complaints = await Promise.all(
        complaintIds.map(async (id) => {
          const result = await this.getComplaint(id);
          return result.success ? result.data : null;
        })
      );

      return {
        success: true,
        data: complaints.filter(c => c !== null),
      };
    } catch (error) {
      console.error('❌ Failed to get all complaints:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash) {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (!receipt) {
        return { success: false, error: 'Transaction not found' };
      }
      
      return {
        success: true,
        data: {
          hash: receipt.hash,
          blockNumber: receipt.blockNumber,
          blockHash: receipt.blockHash,
          gasUsed: receipt.gasUsed.toString(),
          status: receipt.status === 1 ? 'Success' : 'Failed',
          from: receipt.from,
          to: receipt.to,
        },
      };
    } catch (error) {
      console.error('❌ Failed to get transaction receipt:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get Etherscan link for transaction
   */
  getEtherscanLink(txHash) {
    return `https://sepolia.etherscan.io/tx/${txHash}`;
  }

  /**
   * Get Etherscan link for contract
   */
  getContractEtherscanLink() {
    return `https://sepolia.etherscan.io/address/${this.contractAddress}`;
  }

  /**
   * Check if blockchain service is available
   */
  isAvailable() {
    return this.isConnected && this.contract !== null;
  }

  /**
   * Listen for blockchain events
   */
  onComplaintRegistered(callback) {
    if (!this.contract) return;
    this.contract.on('ComplaintRegistered', (complaintId, timestamp, category, hashedDetails, registeredBy, event) => {
      callback({
        complaintId,
        timestamp: Number(timestamp),
        category,
        hashedDetails,
        registeredBy,
        transactionHash: event.log.transactionHash,
      });
    });
  }

  onStatusUpdated(callback) {
    if (!this.contract) return;
    this.contract.on('StatusUpdated', (complaintId, oldStatus, newStatus, timestamp, updatedBy, event) => {
      callback({
        complaintId,
        oldStatus: STATUS_ENUM[oldStatus],
        newStatus: STATUS_ENUM[newStatus],
        timestamp: Number(timestamp),
        updatedBy,
        transactionHash: event.log.transactionHash,
      });
    });
  }

  /**
   * Remove event listeners
   */
  removeAllListeners() {
    if (this.contract) {
      this.contract.removeAllListeners();
    }
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();
export default blockchainService;

// Export utilities
export { STATUS_ENUM, STATUS_TO_NUMBER };
