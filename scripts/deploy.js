async function main() {
    const [deployer] = await ethers.getSigners();

    const initialMintCost = '5000000000000000000';
    const initialSupply = '1000000000000000000000000000';
    const listingFee = '5000000000000000';
    const tokenName = 'UTT Token';
    const tokenSymbol = 'UTT';

  
    console.log("Deploying marketplace with the account:", deployer.address);
  
    console.log("Account balance:", (await deployer.getBalance()).toString());
  
    const MarketPlace = await ethers.getContractFactory("NftMarketplace");
    const marketplace = await MarketPlace.deploy(initialMintCost, initialSupply, listingFee, tokenName, tokenSymbol);
  
    console.log("NFT Markeplace address:", marketplace.address);

    console.log("Deploying NFT with the account:", deployer.address);
  
    console.log("Account balance:", (await deployer.getBalance()).toString());
  
    const NFT = await ethers.getContractFactory("NFT");
    const nft = await NFT.deploy(marketplace.address);
  
    console.log("NFT address:", nft.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });