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

  // Deploy SavingsPot
  console.log(`Deploying SavingsPot with MUSD: ${musdAddress}...`);
  const SavingsPot = await hre.ethers.getContractFactory("SavingsPot");
  const savingsPot = await SavingsPot.deploy(musdAddress);
  await savingsPot.waitForDeployment();
  const savingsPotAddress = await savingsPot.getAddress();
  
  console.log("SavingsPot deployed successfully to:", savingsPotAddress);

  console.log("\n--- Verification command ---");
  console.log(`npx hardhat verify --network ${hre.network.name} ${savingsPotAddress} "${musdAddress}"`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
