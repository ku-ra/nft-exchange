const { ethers } = require("hardhat");
const hre = require("hardhat");

require("dotenv").config();

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const signer = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY, ethers.getDefaultProvider());

  const Swap = await hre.ethers.getContractFactory("Swap")
  const swap = await Swap.deploy();

  await swap.deployed();

  console.log("Contract deployed to:", swap.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
