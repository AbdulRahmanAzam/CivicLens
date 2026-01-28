const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting ComplaintTracker deployment...\n");

  // Get network info
  const network = hre.network.name;
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("📋 Deployment Configuration:");
  console.log("   Network:", network);
  console.log("   Deployer:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("   Balance:", hre.ethers.formatEther(balance), "ETH\n");

  if (balance === 0n) {
    console.error("❌ Error: Deployer account has no ETH!");
    console.log("   Get Sepolia ETH from: https://sepoliafaucet.com");
    process.exit(1);
  }

  // Deploy the contract
  console.log("📝 Deploying ComplaintTracker contract...");
  const ComplaintTracker = await hre.ethers.getContractFactory("ComplaintTracker");
  const complaintTracker = await ComplaintTracker.deploy();
  
  await complaintTracker.waitForDeployment();
  const contractAddress = await complaintTracker.getAddress();
  
  console.log("✅ ComplaintTracker deployed to:", contractAddress);
  console.log("   Transaction hash:", complaintTracker.deploymentTransaction().hash);

  // Save deployment info
  const deploymentInfo = {
    network: network,
    contractAddress: contractAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    transactionHash: complaintTracker.deploymentTransaction().hash,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
  };

  // Save to deployments folder
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentPath = path.join(deploymentsDir, `${network}.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n📁 Deployment info saved to:", deploymentPath);

  // Save ABI for frontend
  const artifactsDir = path.join(__dirname, "../../frontend/src/contracts");
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }

  const artifact = await hre.artifacts.readArtifact("ComplaintTracker");
  const contractInfo = {
    address: contractAddress,
    abi: artifact.abi,
    network: network,
    chainId: deploymentInfo.chainId,
  };

  const contractPath = path.join(artifactsDir, "ComplaintTracker.json");
  fs.writeFileSync(contractPath, JSON.stringify(contractInfo, null, 2));
  console.log("📁 Contract ABI saved to:", contractPath);

  // Verification instructions
  if (network === "sepolia") {
    console.log("\n🔍 Contract Verification:");
    console.log("   View on Etherscan: https://sepolia.etherscan.io/address/" + contractAddress);
    console.log("\n   To verify contract source code, run:");
    console.log(`   npx hardhat verify --network sepolia ${contractAddress}`);
  }

  console.log("\n🎉 Deployment complete!");
  console.log("\n📋 Next Steps:");
  console.log("   1. Copy CONTRACT_ADDRESS=" + contractAddress + " to your .env file");
  console.log("   2. The ABI has been automatically copied to frontend/src/contracts/");
  console.log("   3. Restart your frontend application");

  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
