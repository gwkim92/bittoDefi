// const { expect } = require("chai");
// const { ethers } = require("hardhat");
// const dotenv = require("dotenv");
// dotenv.config();
// const contractDB = require("../dataBase/controller/contractController");
// const addressDB = require("../dataBase/controller/addressController");

// async function getSigners() {
//   const [owner, admin, user] = await ethers.getSigners();
//   return { owner, admin, user };
// }

// describe("MultiDataConsumerV3 and BittoSwapV1", function () {
//   this.timeout(1200000);
//   let ownerAddress,
//     adminAddress,
//     userAddress,
//     bittoSwapAddress,
//     bittoSwapAbi,
//     bittoSwapProxyAddress,
//     bittoSwapProxyAbi,
//     priceAddress,
//     priceAbi,
//     priceProxyAddress,
//     priceProxyAbi,
//     MockToken1Address,
//     MockToken1Abi,
//     swapInstance,
//     priceInstance,
//     mockToken1Instance,
//     owner,
//     admin,
//     user,
//     btcUsdAddress,
//     daiUsdAddress,
//     ethUsdAddress,
//     linkUsdAddress,
//     usdcUsdAddress;

//   before(async function () {
//     ({ owner, admin, user } = await getSigners());

//     btcUsdAddress = process.env.BTCUSDADDRESS;
//     daiUsdAddress = process.env.DAIUSDADDERSS;
//     ethUsdAddress = process.env.ETHUSDADDRESS;
//     linkUsdAddress = process.env.LINKUSDADDRESS;
//     usdcUsdAddress = process.env.USDCUSDADDRESS;

//     const OwnerAddressDB = await addressDB.addresss.getAddressInfo("owner");
//     const AdminAddressDb = await addressDB.addresss.getAddressInfo("admin");
//     const UserAddressDb = await addressDB.addresss.getAddressInfo("user");
//     ownerAddress = OwnerAddressDB.dataValues.address;
//     adminAddress = AdminAddressDb.dataValues.address;
//     userAddress = UserAddressDb.dataValues.address;
//     const bittoSwapV1DB = await contractDB.contracts.getContractInfo(
//       "bittoSwapV1"
//     );
//     const BittoSwapProxyDB = await contractDB.contracts.getContractInfo(
//       "BittoSwapProxy"
//     );
//     const MultiDataConsumerV3DB = await contractDB.contracts.getContractInfo(
//       "MultiDataConsumerV3"
//     );
//     const MultiDataConsumerV3ProxyDB =
//       await contractDB.contracts.getContractInfo("MultiDataConsumerV3Proxy");
//     const MockToken1DB = await contractDB.contracts.getContractInfo(
//       "MockToken1"
//     );

//     bittoSwapAddress = await bittoSwapV1DB.dataValues.address;
//     bittoSwapAbi = await bittoSwapV1DB.dataValues.abi;
//     bittoSwapProxyAddress = await BittoSwapProxyDB.dataValues.address;
//     bittoSwapProxyAbi = await BittoSwapProxyDB.dataValues.abi;
//     priceAddress = await MultiDataConsumerV3DB.dataValues.address;
//     priceAbi = await MultiDataConsumerV3DB.dataValues.abi;
//     priceProxyAddress = await MultiDataConsumerV3ProxyDB.dataValues.address;
//     priceProxyAbi = await MultiDataConsumerV3ProxyDB.dataValues.abi;
//     MockToken1Address = await MockToken1DB.dataValues.address;
//     MockToken1Abi = await MockToken1DB.dataValues.abi;

//     mockToken1Instance = await ethers.getContractAt(
//       MockToken1Abi,
//       MockToken1Address
//     );
//     priceInstance = new ethers.Contract(priceProxyAddress, priceAbi, admin);
//     swapInstance = new ethers.Contract(
//       bittoSwapProxyAddress,
//       bittoSwapAbi,
//       admin
//     );

//     ///contract Db data get & getContractAt
//   });

//   it("Should set the price feed correctly and return the latest price", async function () {
//     // Set the price feed for a token (mock token address used here)
//     console.log("priceOrcleProxy : ", priceAddress, priceProxyAddress);
//     console.log("owner : ", owner.address);
//     console.log("admin : ", admin.address);

//     await priceInstance
//       .connect(admin)
//       .setPriceFeed(MockToken1Address, btcUsdAddress);

//     // Get the latest price (this will fail if the mock price feed doesn't behave as expected)
//     const latestPrice = await priceInstance.getLatestPrice(MockToken1Address);
//     // Print out the returned value
//     console.log(`The latest price is: ${latestPrice.toString()}`);

//     expect(latestPrice).to.not.equal(0); // Or any other assertion that makes sense depending on your mock
//   });

//   it("Should add a pair and perform a swap", async function () {
//     // Pair 추가
//     // const { owner, user } = await getSigners();
//     const BittoSwapV1 = new ethers.Contract(
//       swapProxyAddress,
//       BittoSwapV1Impl.interface,
//       admin
//     );

//     await swapInstance.addPair(
//       MockToken1Address,
//       MockToken2Address,
//       btcUsdAddress,
//       daiUsdAddress
//     );

//     // Swap 수행
//     const amountIn = ethers.parseEther("1");
//     const tokenIn = MockToken1Address;
//     const tokenOut = MockToken2Address;

//     const initialBalanceUser = await MockToken1Impl.balanceOf(user.address);

//     // User should approve the contract to spend tokens on their behalf.
//     await MockToken1.connect(user).approve(BittoSwapV1.address, amountIn);

//     // Now we can perform the swap.
//     await BittoSwapV1.connect(user).swap(amountIn, tokenIn, tokenOut);

//     const finalBalanceUser = await MockToken2.balanceOf(user.address);

//     expect(finalBalanceUser.gt(initialBalanceUser)).to.be.true;
//   });

//   it("Should pause and unpause the contract", async function () {
//     await BittoSwapV1Impl.connect(owner).pause();

//     const isPaused = await BittoSwapV1Impl.paused();
//     expect(isPaused).to.be.true;

//     await BittoSwapV1Impl.connect(owner).unpause();

//     const isUnpaused = await BittoSwapV1Impl.paused();
//     expect(isUnpaused).to.be.false;
//   });

//   it("Should prevent non-admin from adding a pair", async function () {
//     const nonAdmin = user;

//     const token0 = MockToken1Address;
//     const token1 = MockToken2Address;
//     const feedAddress0 = btcUsdAddress;
//     const feedAddress1 = daiUsdAddress;

//     // 이 부분에서 Revert가 예상됩니다.
//     await expect(
//       BittoSwapV1Impl.connect(nonAdmin).addPair(
//         token0,
//         token1,
//         feedAddress0,
//         feedAddress1
//       )
//     ).to.be.revertedWith("Ownable: caller is not the owner");
//   });

//   it("Should revert when swapping with insufficient balance", async function () {
//     const amountIn = ethers.parseEther("10");

//     const token0 = MockToken1Address;
//     const token1 = MockToken2Address;

//     await expect(
//       BittoSwapV1Impl.connect(user).swap(amountIn, token0, token1)
//     ).to.be.revertedWith("Insufficient balance");
//   });

//   it("Should revert when adding a pair with invalid oracle prices", async function () {
//     const token0 = MockToken1Address;
//     const token1 = MockToken2Address;
//     const feedAddress0 = ethUsdAddress;
//     const feedAddress1 = linkUsdAddress;

//     await expect(
//       BittoSwapV1Impl.connect(owner).addPair(
//         token0,
//         token1,
//         feedAddress0,
//         feedAddress1
//       )
//     ).to.be.revertedWith("Invalid oracle prices");
//   });

//   it("Should update reserves and prices correctly", async function () {
//     const token0 = MockToken1Address;
//     const token1 = MockToken2Address;
//     const feedAddress0 = btcUsdAddress;
//     const feedAddress1 = daiUsdAddress;

//     await BittoSwapV1Impl.connect(owner).addPair(
//       token0,
//       token1,
//       feedAddress0,
//       feedAddress1
//     );

//     const amountIn = ethers.parseEther("1");
//     const tokenIn = token0;
//     const tokenOut = token1;

//     // 초기 리저브 값들을 가져오는 코드를 추가
//     const initialReserve0 = await BittoSwapV1Impl.getReserves(token0, token1);
//     const initialReserve1 = await BittoSwapV1Impl.getReserves(token1, token0);

//     await BittoSwapV1Impl.connect(user).swap(amountIn, tokenIn, tokenOut);

//     const finalReserve0 = await BittoSwapV1Impl.getReserves(token0, token1);
//     const finalReserve1 = await BittoSwapV1Impl.getReserves(token1, token0);

//     expect(finalReserve0.reserve0.gt(initialReserve0.reserve0)).to.be.true;
//     expect(finalReserve0.reserve1.lt(initialReserve0.reserve1)).to.be.true;
//     expect(finalReserve1.reserve1.gt(initialReserve1.reserve1)).to.be.true;
//     expect(finalReserve1.reserve0.lt(initialReserve1.reserve0)).to.be.true;
//   });

//   it("Should update swap storage correctly", async function () {
//     const token0 = MockToken1Address;
//     const token1 = MockToken2Address;
//     const feedAddress0 = btcUsdAddress;
//     const feedAddress1 = daiUsdAddress;

//     await BittoSwapV1Impl.connect(owner).addPair(
//       token0,
//       token1,
//       feedAddress0,
//       feedAddress1
//     );

//     const amountIn = ethers.parseEther("1");
//     const tokenIn = token0;
//     const tokenOut = token1;

//     const initialSwapCount = await BittoSwapV1Impl.swapStorage.totalSwaps();

//     await BittoSwapV1Impl.connect(user).swap(amountIn, tokenIn, tokenOut);

//     const finalSwapCount = await BittoSwapV1Impl.swapStorage.totalSwaps();

//     expect(finalSwapCount.eq(initialSwapCount.add(1))).to.be.true;
//   });

//   it("Should handle multiple pairs and swaps correctly", async function () {
//     const token0 = MockToken1Address;
//     const token1 = MockToken2Address;
//     const feedAddress0 = btcUsdAddress;
//     const feedAddress1 = daiUsdAddress;
//     const token2 = MockToken3Address;
//     const token3 = MockToken4Address;
//     const feedAddress2 = ethUsdAddress;
//     const feedAddress3 = usdcUsdAddress;
//     await BittoSwapV1Impl.connect(owner).addPair(
//       token0,
//       token1,
//       feedAddress0,
//       feedAddress1
//     );
//     await BittoSwapV1Impl.connect(owner).addPair(
//       token2,
//       token3,
//       feedAddress2,
//       feedAddress3
//     );

//     const amountIn1 = ethers.parseEther("1");
//     const amountIn2 = ethers.parseEther("2");
//     const tokenIn1 = token0;
//     const tokenOut1 = token1;
//     const tokenIn2 = token2;
//     const tokenOut2 = token3;

//     const initialBalanceUser = await MockToken1Impl.balanceOf(user.address);
//     await BittoSwapV1Impl.connect(user).swap(amountIn1, tokenIn1, tokenOut1);
//     await BittoSwapV1Impl.connect(user).swap(amountIn2, tokenIn2, tokenOut2);
//     const finalBalanceUser = await MockToken1Impl.balanceOf(user.address);

//     const expectedBalance = initialBalanceUser
//       .add(amountIn1) // 첫 번째 스왑
//       .add(amountIn2); // 두 번째 스왑

//     expect(finalBalanceUser.eq(expectedBalance)).to.be.true;
//   });

//   it("Should prevent unauthorized access to pause and unpause functions", async function () {
//     const nonAdmin = user;

//     await expect(BittoSwapV1Impl.connect(nonAdmin).pause()).to.be.revertedWith(
//       "Ownable: caller is not the owner"
//     );

//     await expect(
//       BittoSwapV1Impl.connect(nonAdmin).unpause()
//     ).to.be.revertedWith("Ownable: caller is not the owner");
//   });

//   it("Should handle edge cases for swapping", async function () {
//     const amountIn = ethers.parseEther("1");
//     const token0 = MockToken1Address;
//     const token1 = MockToken2Address;

//     // 컨트랙트에 보유 토큰 잔액이 없는 경우 스왑 시도
//     await expect(
//       BittoSwapV1Impl.connect(user).swap(amountIn, token0, token1)
//     ).to.be.revertedWith("Transfer failed");
//   });

//   it("Should prevent adding a pair with the same tokens and feeds", async function () {
//     const token0 = MockToken1Address;
//     const token1 = MockToken2Address;
//     const feedAddress0 = btcUsdAddress;
//     const feedAddress1 = daiUsdAddress;

//     await expect(
//       BittoSwapV1Impl.connect(owner).addPair(
//         token0,
//         token1,
//         feedAddress0,
//         feedAddress1
//       )
//     ).to.be.revertedWith("Pair already exists");
//   });

//   it("Should revert when attempting to add a pair with zero address tokens", async function () {
//     const { owner } = await getSigners();
//     const { BittoSwapV1Impl, MockToken2Address, btcUsdAddress, daiUsdAddress } =
//       await loadFixture(deployFixture);
//     const token0 = ethers.constants.AddressZero;
//     const token1 = MockToken2Address;
//     const feedAddress0 = btcUsdAddress;
//     const feedAddress1 = daiUsdAddress;

//     await expect(
//       BittoSwapV1Impl.connect(owner).addPair(
//         token0,
//         token1,
//         feedAddress0,
//         feedAddress1
//       )
//     ).to.be.revertedWith("Zero address");
//   });

//   it("Should allow admin to remove a pair", async function () {
//     const { owner } = await getSigners();
//     const { BittoSwapV1Impl, MockToken1Address, MockToken2Address } =
//       await loadFixture(deployFixture);
//     const token0 = MockToken1Address;
//     const token1 = MockToken2Address;

//     await BittoSwapV1Impl.connect(owner).removePair(token0, token1);

//     const pairExists = await BittoSwapV1Impl.pairExists(token0, token1);
//     expect(pairExists).to.be.false;
//   });

//   it("Should prevent non-admin from removing a pair", async function () {
//     const { owner, user } = await getSigners();
//     const { BittoSwapV1Impl, MockToken1Address, MockToken2Address } =
//       await loadFixture(deployFixture);
//     const nonAdmin = user;
//     const token0 = MockToken1Address;
//     const token1 = MockToken2Address;

//     await expect(
//       BittoSwapV1Impl.connect(nonAdmin).removePair(token0, token1)
//     ).to.be.revertedWith("Ownable: caller is not the owner");
//   });
// });
