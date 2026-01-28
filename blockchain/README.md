# CivicLens Blockchain Transparency Feature

This document explains how to set up and use the blockchain transparency feature in CivicLens.

## Overview

CivicLens uses the Sepolia Ethereum testnet to provide an immutable, transparent record of all complaints and status updates. This ensures accountability and builds trust between citizens and government officials.

## Architecture

### Smart Contract (`ComplaintTracker.sol`)
- Registers complaints with unique IDs
- Tracks all status changes
- Provides public verification
- Events for transparency

### Frontend Integration
- `blockchainService.js` - Ethers.js integration
- `BlockchainStatus.jsx` - Status display component
- `TransactionHistory.jsx` - History modal
- `TransparencyDashboard.jsx` - Public dashboard

## Setup Instructions

### 1. Blockchain Setup

```bash
# Navigate to blockchain folder
cd blockchain

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your credentials
```

### 2. Get Sepolia Test ETH

1. Get a Sepolia testnet wallet (MetaMask recommended)
2. Visit a Sepolia faucet:
   - https://sepoliafaucet.com/
   - https://faucet.sepolia.dev/
3. Request test ETH (free)

### 3. Deploy Contract

```bash
# Deploy to Sepolia
npx hardhat run scripts/deploy.js --network sepolia
```

The deployment script will:
- Deploy the contract
- Save deployment info to `deployments/`
- Copy ABI to `frontend/src/contracts/`
- Display the contract address

### 4. Frontend Configuration

Update `frontend/.env`:
```
VITE_CONTRACT_ADDRESS=<deployed_contract_address>
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/<your_project_id>
```

## Features

### For Citizens
- View blockchain verification status on complaints
- See transaction history with Etherscan links
- Verify records independently

### For Officials
- All actions are recorded on-chain
- Transparent audit trail
- Proof of timely responses

### Transparency Dashboard (`/transparency`)
- Public access (no login required)
- Shows all blockchain-recorded complaints
- Search and filter capabilities
- Direct Etherscan verification links

## API Reference

### BlockchainService Methods

```javascript
import { blockchainService } from './services/blockchainService';

// Initialize (read-only)
await blockchainService.initialize();

// Connect wallet for write operations
await blockchainService.connectWallet();

// Register complaint
await blockchainService.registerComplaint(complaintId, category, details);

// Update status
await blockchainService.updateStatus(complaintId, newStatus);

// Get complaint data
const complaint = await blockchainService.getComplaint(complaintId);

// Get status history
const history = await blockchainService.getComplaintHistory(complaintId);
```

### Status Enum

```javascript
const STATUS_ENUM = {
  0: 'Pending',
  1: 'Under Review',
  2: 'In Progress',
  3: 'Resolved',
  4: 'Rejected',
  5: 'Closed'
};
```

## Security Considerations

1. **Private Keys**: Never commit private keys. Use environment variables.
2. **Testnet Only**: Currently using Sepolia. For production, audit contract first.
3. **Privacy**: Only hashed details are stored on-chain.

## Troubleshooting

### "Network not configured"
- Ensure MetaMask is set to Sepolia
- The app will prompt to switch networks

### "Insufficient funds"
- Get test ETH from a Sepolia faucet

### "Transaction failed"
- Check if contract is deployed correctly
- Verify you have the authorization (owner/updater)

## Contract Verification

To verify your contract on Etherscan:

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```
