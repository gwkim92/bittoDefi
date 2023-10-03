//유동성 제공 및 제거, 리저브 조회 테스트
//풀 프록시 컨트렉트 주소로 트랜잭션 전송
//require data => 풀 프록시 address, 풀 abi => creatPool db 저장시
//각 페어에 대한 가격 세팅과 종류가 정해져있음
//
const { ethers } = require("hardhat");
const dotenv = require("dotenv");
dotenv.config();
const contractDB = require("../dataBase/controller/contractController");
const addressDB = require("../dataBase/controller/addressController");

const OwnerAddressDB = await addressDB.addresss.getAddressInfo("owner");
const AdminAddressDb = await addressDB.addresss.getAddressInfo("admin");
const userAddressDb = await addressDB.addresss.getAddressInfo("user");

let userAddress = userAddressDb.dataValues.address;

let token1DB = await contractDB.contracts.getContractInfo("MockToken1");
let token2DB = await contractDB.contracts.getContractInfo("MockToken2");
let token1Address = token1DB.dataValues.address;
let token1Abi = token1DB.dataValues.abi;
let token2Address = token2DB.dataValues.address;
let token2Abi = token2DB.dataValues.abi;
let poolDB = await contractDB.contracts.getContractInfo("eth/link");
let poolAddress = poolDB.dataValues.address;
let poolAbi = poolDB.dataValues.abi;

const [owner, admin, user] = await ethers.getSigners();

async function transferToken() {
  const amount1 = ethers.parseEther("1");
  const amount2 = ethers.parseEther("1");
  const tokenA = new ethers.Contract(token1Address, token1Abi, owner);
  const tokenB = new ethers.Contract(token2Address, token2Abi, owner);

  await tokenA.mint(userAddress, amount1);
  await tokenB.mint(userAddress, amount2);
}

async function main() {
  // Attach to the BittoSwapPool contract
  await transferToken();

  const pool = new ethers.Contract(poolAddress, poolAbi, user); // replace poolAddress with your pool contract address

  // Set up ERC20 contracts for the tokens
  const token1 = new ethers.Contract(token1Address, token1Abi, user); // replace token0Address with your token0 address
  const token2 = new ethers.Contract(token2Address, token2Abi, user); // replace token1Address with your token1 address

  // Approve the pool to spend the tokens
  await token1.approve(poolAddress, amountA);
  await token2.approve(poolAddress, amountB);

  // Provide liquidity
  await pool.provideLiquidity(amountA, amountB);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
