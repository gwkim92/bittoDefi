const { ethers } = require("hardhat");
const dotenv = require("dotenv");
dotenv.config();
const contractDB = require("../dataBase/controller/contractController");
const addressDB = require("../dataBase/controller/addressController");

//npx hardhat run test/swapTest2.js --network sepolia
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
  const latestTokenAPrice = await priceOracle.getLatestPrice(token1Address);
  const latestTokenBPrice = await priceOracle.getLatestPrice(token2Address);

  let swapDB = await contractDB.contracts.getContractInfo("BittoSwapContract");
  let swapAddress = swapDB.dataValues.address;
  let swapAbi = swapDB.dataValues.abi;

  console.log("token1Address : ", token1Address, token2Address);
  console.log("User Address : ", userAddress);
  console.log("priceOracle Address : ", priceOracleAddress);
  console.log("swap Address : ", swapAddress);
  console.log("pool Address : ", poolAddress);

  const swapInstance = new ethers.Contract(swapAddress, swapAbi, user);

  const amountA = ethers.parseUnits("1", 18); // Define the amounts to be provided.
  console.log("amountA : ", amountA);
  console.log(typeof amountA);

  let amountB = (amountA * latestTokenAPrice) / latestTokenBPrice;

  console.log("amountB : ", amountB);

  try {
    await swap(amountA, amountB, token1Address, token2Address);
  } catch (error) {
    console.error(error.message);
  }

  async function swap(amountA, amountB, token1Address, token2Address) {
    const pool = new ethers.Contract(poolAddress, poolAbi, user);
    console.log("Swap Start");
    console.log("amount A, B : ", amountA, amountB);
    const TokenA = new ethers.Contract(token1Address, token1Abi, user);
    const TokenB = new ethers.Contract(token2Address, token2Abi, user);

    // Mint tokens to user.
    let tx = await TokenA.mint(userAddress, amountA);
    let receipt = await tx.wait();
    if (receipt.status == 1) {
      console.log(`Minting ${amountA} tokens to ${userAddress} successful!`);
    } else {
      console.error(`Minting ${amountA} tokens to ${userAddress} failed.`);
      return;
    }

    // Check user's balance after minting.
    const balanceAfterMint = await TokenA.balanceOf(userAddress);
    console.log(
      "user A balance : ",
      ethers.formatUnits(balanceAfterMint, "ether")
    );

    // Check user's TokenB balance.
    const balanceBBeforeSwap = await TokenB.balanceOf(userAddress);
    console.log(
      "user B balance before swap: ",
      ethers.formatUnits(balanceBBeforeSwap, "ether")
    );

    // Approve the swap contract to spend user's tokens.
    let tx1 = await TokenA.approve(swapAddress, amountA);
    let receipt1 = await tx1.wait();
    if (receipt1.status == true) {
      console.log("Approval for Swap Contract by Token A successful");
    } else {
      console.error("Approval for Swap Contract by Token A failed");
    }
    // Approve the swap contract to receive user's tokens from the pool.
    let tx2 = await TokenB.approve(swapAddress, amountB);
    let receipt2 = await tx2.wait();
    if (receipt2.status == true) {
      console.log("Approval for Swap Contract by Token B successful");
    } else {
      console.error("Approval for Swap Contract by Token B failed");
    }

    // Check pool's reserves before swap.
    const poolToken0Address = await pool.token0();

    let reserveInBeforeSwap;
    let reserveOutBeforeSwap;

    if (token1Address == poolToken0Address) {
      console.log("tokenIn = poolToken0Address");
      reserveInBeforeSwap = await pool.reserve0();
      reserveOutBeforeSwap = await pool.reserve1();
    } else {
      reserveInBeforeSwap = await pool.reserve1();
      reserveOutBeforeSwap = await pool.reserve0();
    }

    console.log(
      "Reserve of tokenIn before swap:",
      ethers.formatUnits(reserveInBeforeSwap, 18)
    );
    console.log(
      "Reserve of tokenOut before swap:",
      ethers.formatUnits(reserveOutBeforeSwap, 18)
    );
    try {
      const result = await swapInstance.swap(
        amountA,
        amountB,
        token1Address,
        token2Address
      );
      const receipts = await result.wait();
      console.log("swap receipts : ", receipts);
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
      // Log the Swap event.
      const swapEvent = receipts.events?.filter((x) => {
        return x.event == "Swap";
      });

      if (swapEvent && swapEvent.length > 0) {
        console.log("Swap event: ", swapEvent[0].args);
        console.log("Sender: ", swapEvent[0].args.sender);
        console.log("TokenIn: ", swapEvent[0].args.tokenIn);
        console.log("TokenOut: ", swapEvent[0].args.tokenOut);
        console.log(
          "AmountIn: ",
          ethers.formatUnits(swapEvent[0].args.amountIn, "ether")
        );
        console.log(
          "AmountOut: ",
          ethers.formatUnits(swapEvent[0].args.amountOut, "ether")
        );
        console.log("PoolAddress: ", swapEvent[0].args.poolAddress);
      }
    } catch (error) {
      console.error("Swap transaction failed:", error.message);
    }

    const balanceAfterSwap = await TokenA.balanceOf(userAddress);
    const balanceBAfterSwap = await TokenB.balanceOf(userAddress);

    console.log("user swap before tokenA : ", balanceAfterMint);
    console.log("user swap after tokenA : ", balanceAfterSwap);
    console.log("user swap before tokenB : ", balanceBBeforeSwap);
    console.log("user swap after tokenB : ", balanceBAfterSwap);
  }
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
