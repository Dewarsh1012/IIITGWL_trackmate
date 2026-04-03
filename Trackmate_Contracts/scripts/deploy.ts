import { ethers } from "hardhat";

async function main() {
    console.log("Starting TrackMate Smart Contract Deployments...\n");

    const [deployer] = await ethers.getSigners();
    console.log(`Executing deployments with authority account: ${deployer.address}`);

    // Deploy IdentityRegistry
    const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
    const identityRegistry = await IdentityRegistry.deploy();
    await identityRegistry.waitForDeployment();
    const identityAddress = await identityRegistry.getAddress();
    console.log(`✅ IdentityRegistry deployed to: ${identityAddress}`);

    // Deploy EFIRLedger
    const EFIRLedger = await ethers.getContractFactory("EFIRLedger");
    const efirLedger = await EFIRLedger.deploy();
    await efirLedger.waitForDeployment();
    const efirAddress = await efirLedger.getAddress();
    console.log(`✅ EFIRLedger deployed to: ${efirAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
