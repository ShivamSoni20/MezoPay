const hre = require("hardhat");

async function main() {
  console.log("Starting deployment on network:", hre.network.name);

  const musdAddress = "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503";
  const registryAddress = "0x8eB4E69A550Dc63BaB674469eBC516d893793de8";

  // 1. Deploy SplitManager
  console.log(`Deploying SplitManager with MUSD: ${musdAddress} and Registry: ${registryAddress}...`);
  const SplitManager = await hre.ethers.getContractFactory("SplitManager");
  const splitManager = await SplitManager.deploy(musdAddress, registryAddress);
  await splitManager.waitForDeployment();
  const splitManagerAddress = await splitManager.getAddress();
  console.log("SplitManager deployed to:", splitManagerAddress);

  // 2. Deploy SavingsPot
  console.log(`Deploying SavingsPot with MUSD: ${musdAddress}...`);
  const SavingsPot = await hre.ethers.getContractFactory("SavingsPot");
  const savingsPot = await SavingsPot.deploy(musdAddress);
  await savingsPot.waitForDeployment();
  const savingsPotAddress = await savingsPot.getAddress();
  console.log("SavingsPot deployed to:", savingsPotAddress);

  console.log("\n--- Verification commands ---");
  console.log(`npx hardhat verify --network ${hre.network.name} ${splitManagerAddress} "${musdAddress}" "${registryAddress}"`);
  console.log(`npx hardhat verify --network ${hre.network.name} ${savingsPotAddress} "${musdAddress}"`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
