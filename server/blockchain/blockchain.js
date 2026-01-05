import Web3 from 'web3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let web3 = null;
let contract = null;
let accounts = null;
let ganacheProvider = null;

// Simple voting contract ABI
const VOTING_CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "classId", "type": "string" },
      { "internalType": "string", "name": "studentId", "type": "string" },
      { "internalType": "string", "name": "positionId", "type": "string" },
      { "internalType": "string", "name": "candidateId", "type": "string" },
      { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "recordVote",
    "outputs": [
      { "internalType": "bytes32", "name": "voteHash", "type": "bytes32" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "classId", "type": "string" },
      { "internalType": "string", "name": "positionId", "type": "string" }
    ],
    "name": "getVoteCount",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "voteHash", "type": "bytes32" }
    ],
    "name": "verifyVote",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export async function initBlockchain() {
  try {
    // Try to connect to Ganache (local blockchain)
    const ganacheUrl = process.env.GANACHE_URL || 'http://localhost:7545';
    
    try {
      web3 = new Web3(ganacheUrl);
      await web3.eth.getBlockNumber();
      console.log(`✅ Connected to Ganache at ${ganacheUrl}`);
    } catch (error) {
      console.warn('⚠️  Ganache not found, using in-memory blockchain simulation');
      // Fallback to in-memory simulation
      web3 = new Web3();
      accounts = await web3.eth.accounts.create();
    }

    // Get accounts
    if (!accounts) {
      accounts = await web3.eth.getAccounts();
    }

    // Deploy or load contract
    const contractPath = join(__dirname, '../contracts/VotingContract.sol');
    const contractAddressPath = join(__dirname, '../data/contract-address.json');

    // For now, we'll use a simulated contract approach
    // In production, you'd deploy the actual contract
    if (fs.existsSync(contractAddressPath)) {
      const contractData = JSON.parse(fs.readFileSync(contractAddressPath, 'utf8'));
      contract = new web3.eth.Contract(VOTING_CONTRACT_ABI, contractData.address);
      console.log(`✅ Loaded contract at ${contractData.address}`);
    } else {
      // Simulate contract for development
      console.log('📝 Using blockchain simulation mode');
      contract = {
        methods: {
          recordVote: () => ({
            send: async () => {
              // Simulate transaction
              const txHash = web3.utils.keccak256(
                web3.utils.encodePacked(
                  { value: Date.now().toString(), type: 'uint256' },
                  { value: Math.random().toString(), type: 'uint256' }
                )
              );
              return { transactionHash: txHash };
            }
          }),
          getVoteCount: () => ({
            call: async () => '0'
          }),
          verifyVote: () => ({
            call: async () => true
          })
        }
      };
    }

    return { web3, contract, accounts };
  } catch (error) {
    console.error('❌ Blockchain initialization error:', error);
    // Fallback to simulation
    web3 = new Web3();
    return { web3, contract: null, accounts: [] };
  }
}

export async function recordVoteOnBlockchain(classId, studentId, positionId, candidateId, timestamp) {
  try {
    if (!web3 || !contract) {
      // Fallback: generate hash without blockchain
      const hash = web3.utils.keccak256(
        web3.utils.encodePacked(
          { value: classId, type: 'string' },
          { value: studentId, type: 'string' },
          { value: positionId, type: 'string' },
          { value: candidateId, type: 'string' },
          { value: timestamp.toString(), type: 'uint256' }
        )
      );
      return {
        transactionHash: hash,
        blockNumber: Date.now(),
        success: true
      };
    }

    const tx = await contract.methods.recordVote(
      classId,
      studentId,
      positionId,
      candidateId,
      timestamp
    ).send({
      from: accounts[0],
      gas: 300000
    });

    const block = await web3.eth.getBlock(tx.blockNumber);
    
    return {
      transactionHash: tx.transactionHash,
      blockNumber: tx.blockNumber,
      timestamp: block.timestamp,
      success: true
    };
  } catch (error) {
    console.error('Blockchain transaction error:', error);
    // Still return a hash for offline mode
    const hash = web3.utils.keccak256(
      web3.utils.encodePacked(
        { value: Date.now().toString(), type: 'uint256' },
        { value: Math.random().toString(), type: 'uint256' }
      )
    );
    return {
      transactionHash: hash,
      blockNumber: 0,
      success: false,
      error: error.message
    };
  }
}

export async function verifyVoteOnBlockchain(voteHash) {
  try {
    if (!web3 || !contract) {
      return true; // Always verify in simulation mode
    }

    const result = await contract.methods.verifyVote(voteHash).call();
    return result;
  } catch (error) {
    console.error('Blockchain verification error:', error);
    return false;
  }
}

export function getWeb3() {
  return web3;
}

export function getContract() {
  return contract;
}









