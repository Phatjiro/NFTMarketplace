const { ethers } = require("hardhat");

async function main() {

  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contracts here:
  // Phải dùng hàm await để đồng bộ, phải chạy tuần tự từng bước để thực hiện.
  const NFT = await ethers.getContractFactory("NFT"); // Dùng ContractFactory để nhờ nhà máy triển khai NFT.
  const nft = await NFT.deploy();

  // Khai báo cái Marketplace ở đây luôn, để sử dụng
  const Marketplace = await ethers.getContractFactory("Marketplace"); // dùng Factory giống NFT luôn vì Marketplace cũng là contract mà.
  const marketplace = await Marketplace.deploy(1); // Deploy luôn và cho phí là 1%

  console.log("NFT contract address:", nft.address);
  console.log("Marketplace contract address:", marketplace.address);
  
  // For each contract, pass the deployed contract and name to this function to save a copy of the contract ABI and address to the front end.
  saveFrontendFiles(nft, "NFT");
  saveFrontendFiles(marketplace, "Marketplace"); 
  // Set xong tên cho NFT rồi thì "npx hardhat run .\src\backend\scripts\deploy.js --network localhost" để lấy account đầu tiên của
  // hardhat mà deploy thôi.
  // Xong ở phút 37:33

  /**
   * Giải thích 1 tí về marketplace contract:
   * Thì nó là 1 contract mà ở đó users có thể liệt kê
   * ra danh sách NFT mà họ có như là 1 vật phẩm
   * để bán cho khách hàng tiềm năng. (Potential: tiềm năng - vừa học được ^^).
   */
}

function saveFrontendFiles(contract, name) {
  const fs = require("fs");
  const contractsDir = __dirname + "/../../frontend/contractsData";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    contractsDir + `/${name}-address.json`,
    JSON.stringify({ address: contract.address }, undefined, 2)
  );

  const contractArtifact = artifacts.readArtifactSync(name);

  fs.writeFileSync(
    contractsDir + `/${name}.json`,
    JSON.stringify(contractArtifact, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
