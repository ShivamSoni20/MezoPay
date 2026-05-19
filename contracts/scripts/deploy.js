const hre = require("hardhat");

async function main() {
  console.log("Starting deployment on network:", hre.network.name);

  // MUSD address for the network
  let musdAddress;
  if (hre.network.name === "mezomainnet") {
    musdAddress = "0xdD468A1DDc392dcdbEf6db6e34E89AA338F9F186";
  } else {
    // default to testnet
    musdAddress = "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503";
  }

  // 1. Deploy UsernameRegistry
  console.log("Deploying UsernameRegistry...");
  const UsernameRegistry = await hre.ethers.getContractFactory("UsernameRegistry");
  const registry = await UsernameRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("UsernameRegistry deployed to:", registryAddress);

  // 2. Deploy SplitManager
  console.log(`Deploying SplitManager with MUSD: ${musdAddress} and Registry: ${registryAddress}...`);
  const SplitManager = await hre.ethers.getContractFactory("SplitManager");
  const splitManager = await SplitManager.deploy(musdAddress, registryAddress);
  await splitManager.waitForDeployment();
  const splitManagerAddress = await splitManager.getAddress();
  console.log("SplitManager deployed to:", splitManagerAddress);

  console.log("\n--- Verification commands ---");
  console.log(`npx hardhat verify --network ${hre.network.name} ${registryAddress}`);
  console.log(`npx hardhat verify --network ${hre.network.name} ${splitManagerAddress} "${musdAddress}" "${registryAddress}"`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
