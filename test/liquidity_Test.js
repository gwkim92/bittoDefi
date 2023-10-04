const { ethers } = require("hardhat");
const dotenv = require("dotenv");
dotenv.config();
const contractDB = require("../dataBase/controller/contractController");
const addressDB = require("../dataBase/controller/addressController");

//npx hardhat run test/liquidity_Test.js --network sepolia
async function main() {
  const [owner, admin, user] = await ethers.getSigners();
  const userAddressDb = await addressDB.addresss.getAddressInfo("user");

  let userAddress = userAddressDb.dataValues.address;

  let token1DB = await contractDB.contracts.getContractInfo("MockToken1");
  let token2DB = await contractDB.contracts.getContractInfo("MockToken2");
  let token1Address = token1DB.dataValues.address;
  let token1Abi = token1DB.dataValues.abi;
  let token2Address = token2DB.dataValues.address;
  let token2Abi = token2DB.dataValues.abi;
  let poolDB = await contractDB.contracts.getContractInfo("ethLink_Pool_pair");
  let poolAddress = poolDB.dataValues.address;
  let poolAbi = poolDB.dataValues.abi;
  let priceOracleDbData = await contractDB.contracts.getContractInfo(
    "MultiDataConsumerV3Proxy"
  );
  let priceOracleAddress = priceOracleDbData.dataValues.address;
  let priceOracleAbi = priceOracleDbData.dataValues.abi;

  // Attach to the Price Oracle contract
  const priceOracle = new ethers.Contract(
    priceOracleAddress,
    priceOracleAbi,
    user
  );

  const amountA = ethers.parseUnits("10", 18); // Define the amounts to be provided.
  console.log("amountA : ", amountA);
  console.log(typeof amountA);
  // Convert BigNumber to number
  const amountANumber = parseFloat(ethers.formatEther(amountA));
  console.log("amountA (number): ", amountANumber);
  console.log(typeof amountANumber);
  // Calculate the expected ratio based on oracle prices
  const latestTokenAPrice = await priceOracle.getLatestPrice(token1Address);
  const latestTokenBPrice = await priceOracle.getLatestPrice(token2Address);

  console.log("latestTokenAPrice :", latestTokenAPrice);
  console.log("latestTokenBPrice :", latestTokenBPrice);
  // 소수점 이하 8자리로 가격 데이터를 표시
  const priceDecimals = 8;
  const tokenAPrice =
    parseFloat(latestTokenAPrice) / Math.pow(10, priceDecimals);
  const tokenBPrice =
    parseFloat(latestTokenBPrice) / Math.pow(10, priceDecimals);

  const priceRatio = tokenBPrice / tokenAPrice;
  console.log("Token A Price:", tokenAPrice);
  console.log("Token B Price:", tokenBPrice);
  console.log(typeof tokenAPrice);
  // Print out the ratio of the tokens' prices
  console.log("Ratio of Token Prices:", priceRatio);

  // Calculate amountB using floating point arithmetic
  const amountB = amountANumber * priceRatio;

  console.log("amount B : ", amountB.toString()); // 결과를 문자열로 출력
  console.log(typeof amountB);
  // Print out the ratio of amountA to amount B
  // Print out the ratio of Amounts with preserved decimal places
  console.log(
    "Ratio of Amounts (with decimal places):",
    amountB / amountANumber
  );

  // Provide liquidity
  try {
    await provideLiquidity(amountA, amountB);
  } catch (error) {
    console.error(error.message);
  }

  async function provideLiquidity(amountA, amountB) {
    const pool = new ethers.Contract(poolAddress, poolAbi, user);

    const amount1 = ethers.parseUnits("100000", 18);
    const amount2 = ethers.parseUnits("100000", 18);
    const TokenA = new ethers.Contract(token1Address, token1Abi, owner);
    const TokenB = new ethers.Contract(token2Address, token2Abi, owner);

    let tx = await TokenA.mint(userAddress, amount1);
    let receipt = await tx.wait();
    if (receipt.status == 1) {
      console.log(`Minting ${amount1} tokens to ${userAddress} successful!`);
    } else {
      console.log(`Minting ${amount1} tokens to ${userAddress} failed.`);
    }

    let tx2 = await TokenB.mint(userAddress, amount2);
    let receipt2 = await tx2.wait();
    if (receipt2.status == 1) {
      console.log(`Minting ${amount1} tokens to ${userAddress} successful!`);
    } else {
      console.log(`Minting ${amount1} tokens to ${userAddress} failed.`);
    }

    const TokenUserA = new ethers.Contract(token1Address, token1Abi, user);
    const TokenUserB = new ethers.Contract(token2Address, token2Abi, user);

    let tx1 = await TokenUserA.approve(poolAddress, amountA);
    let receipt1 = await tx1.wait();
    if (receipt1.status == true) {
      console.log("Approval for Pool by TokenA successful");
    } else {
      console.log("Approval for Pool by TokenA failed");
    }
    tx = await TokenUserB.approve(poolAddress, amountB);
    receipt = await tx.wait();
    if (receipt.status == true) {
      console.log("Approval for Pool by TokenB successful");
    } else {
      console.log("Approval for Pool by TokenB failed");
    }

    // After minting the tokens
    const balanceA = await TokenUserA.balanceOf(userAddress);
    console.log("Balance of Token A:", ethers.formatUnits(balanceA, 18));
    const balanceB = await TokenUserB.balanceOf(userAddress);
    console.log("Balance of Token B:", ethers.formatUnits(balanceB, 18));

    // After approving the tokens
    const allowanceA = await TokenUserA.allowance(userAddress, poolAddress);
    console.log(
      "Allowance of Token A for Pool:",
      ethers.formatUnits(allowanceA, 18)
    );
    const allowanceB = await TokenUserB.allowance(userAddress, poolAddress);
    console.log(
      "Allowance of Token B for Pool:",
      ethers.formatUnits(allowanceB, 18)
    );

    // Call provideLiquidity function
    result = await pool.provideLiquidity(amountA, amountB);
    receipt = result.wait();
    if (receipt.status == true) {
      console.log("Provided liquidity successfully");
    } else {
      throw Error("Failed to provide liquidity", receipt);
    }
  }
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
