const { ethers } = require("hardhat");
const dotenv = require("dotenv");
dotenv.config();
const contractDB = require("../dataBase/controller/contractController");
const addressDB = require("../dataBase/controller/addressController");

//npx hardhat run test/seconde_liquidity.js --network sepolia

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

  const priceOracle = new ethers.Contract(
    priceOracleAddress,
    priceOracleAbi,
    user
  );
  const pool = new ethers.Contract(poolAddress, poolAbi, user);

  // Get the current reserves directly from the contrac

  const currentReserve0 = await pool.reserve0();
  const currentReserve1 = await pool.reserve1();
  console.log(".currentReserve0 : ", currentReserve0);
  console.log(".currentReserve1 : ", currentReserve1);

  const amountA = ethers.parseUnits("10", 18); // Define the amounts to be provided.
  console.log(".amountA : ", amountA);
  console.log(typeof amountA);

  const tokenA = new ethers.Contract(token1Address, token1Abi, user);
  const tokenB = new ethers.Contract(token2Address, token2Abi, user);

  // Check if the user has enough tokens to provide liquidity
  const balanceTokenA = await tokenA.balanceOf(userAddress);
  const balanceTokenB = await tokenB.balanceOf(userAddress);

  const latestTokenAPrice = await priceOracle.getLatestPrice(token1Address);
  const latestTokenBPrice = await priceOracle.getLatestPrice(token2Address);

  //리저브 비율 조회
  //reserve0, reserve1 (현재 토큰량)
  //tokenPrice0, tokenPrice1 조회
  //reserve0 * tokenPrice0 = reserve1 * tokenPirce1
  // const 절대량 = (reserve0 * tokenPrice0) - (reserve1 * tokenPrice1)
  // 음수인지 양수인지 확인
  // 음수이면 tokenA 의 비율이 모자람 =>
  // |절대량| + 추가 토큰a 제공량 => 추가 토큰a 제공량(amountA * tokenPriceA)/tokenPriceB = amountB 만큼 자동 계산 반환
  // 양수이면 tokenB의 비율이 모자람 =>
  // |절대량| + 추가 토큰a 제공량 => 추가 토큰a 제공량(amountA * tokenPriceA)/tokenPriceB = amountB 만큼 자동 계산 반환 의 반대
  // 0 이면 비율이 같음
  function absBigInt(bigint) {
    return bigint < 0n ? -bigint : bigint;
  }

  let imbalance =
    (amountA + currentReserve0) * latestTokenAPrice -
    currentReserve1 * latestTokenBPrice;
  console.log("비율 계산 : ", imbalance);

  let amountB;

  imbalance = absBigInt(imbalance); // 절대값 계산

  if (
    currentReserve0 * latestTokenAPrice <
    currentReserve1 * latestTokenBPrice
  ) {
    // 음수인 경우 tokenB의 총액량이 크다. tokenA만 채워넣으면 된다.
    console.log("절대량 음수");
    amountB = (imbalance + amountA * latestTokenAPrice) / latestTokenBPrice;
  } else if (
    currentReserve0 * latestTokenAPrice >
    currentReserve1 * latestTokenBPrice
  ) {
    console.log("절대량 양수");
    // 양수인 경우 tokenA의 총액량이 크다. tokenA를 넣되 넘치는 양만큼 tokenB를 넣는다.
    amountB = (amountA * latestTokenAPrice - imbalance) / latestTokenBPrice;
  } else {
    // 0인 경우
    console.log("절대량 ==");
    amountB = (amountA * latestTokenAPrice) / latestTokenBPrice;
  }
  amountB = absBigInt(amountB);

  console.log("amountB : ", amountB);
  // Provide liquidity
  try {
    await provideLiquidity(amountA, amountB);
  } catch (error) {
    console.error(error.message);
  }

  async function provideLiquidity(amountA, amountB) {
    const pool = new ethers.Contract(poolAddress, poolAbi, user);
    console.log("provide liquidity Start");
    console.log("amount A, B : ", amountA, amountB);
    const TokenA = new ethers.Contract(token1Address, token1Abi, owner);
    const TokenB = new ethers.Contract(token2Address, token2Abi, owner);
    let tx = await TokenA.mint(userAddress, amountA);
    let receipt = await tx.wait();
    if (receipt.status == 1) {
      console.log(`Minting ${amountA} tokens to ${userAddress} successful!`);
    } else {
      console.log(`Minting ${amountA} tokens to ${userAddress} failed.`);
    }

    let tx2 = await TokenB.mint(userAddress, amountB);
    let receipt2 = await tx2.wait();
    if (receipt2.status == 1) {
      console.log(`Minting ${amountB} tokens to ${userAddress} successful!`);
    } else {
      console.log(`Minting ${amountB} tokens to ${userAddress} failed.`);
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
    const result = await pool.provideLiquidity(amountA, amountB);
    console.log("ProprovideLiquidityvide Result : ", result);

    const receipts = await result.wait();
    console.log("receipts : ", receipts);
    if (receipts.status == true) {
      console.log("Provided liquidity successfully");

      // After providing liquidity, check the reserves and the ratio
      const updatedReserve0 = await pool.reserve0();
      const updatedReserve1 = await pool.reserve1();

      console.log(".updatedReserve0 : ", updatedReserve0);
      console.log(".updatedReserve1 : ", updatedReserve1);

      const updatedTokenAPrice = await priceOracle.getLatestPrice(
        token1Address
      );
      const updatedTokenBPrice = await priceOracle.getLatestPrice(
        token2Address
      );
      console.log("1 : ", updatedReserve0 * updatedTokenAPrice);
      console.log("2 : ", updatedReserve1 * updatedTokenBPrice);
      console.log(
        "Ratio of Reserve * Price for Token A to Token B: ",
        (updatedReserve0 * updatedTokenAPrice) /
          (updatedReserve1 * updatedTokenBPrice)
      );
    } else {
      throw Error("Failed to provide liquidity", receipts);
    }
  }
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
