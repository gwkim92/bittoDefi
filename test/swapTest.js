// const { expect } = require("chai");
// const { ethers } = require("hardhat");
// const {
//   loadFixture,
// } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

// // npx hardhat test /Users/gimgeon-u/Desktop/Study/bitto/bittoDefi/test/swapTest.js

// async function getSigners() {
//   const [owner, admin, user] = await ethers.getSigners();
//   return { owner, admin, user };
// }

// async function deployFixture() {
//   const { owner, admin, user } = await getSigners();
//   console.log("owner : ", owner.address, admin.address);

//   const btcUsdAddress = process.env.BTCUSDADDRESS;
//   const daiUsdAddress = process.env.DAIUSDADDERSS;
//   const ethUsdAddress = process.env.ETHUSDADDRESS;
//   const linkUsdAddress = process.env.LINKUSDADDRESS;
//   const usdcUsdAddress = process.env.USDCUSDADDRESS;

//   const MultiDataConsumerImpl = await ethers.deployContract(
//     "MultiDataConsumerV3"
//   );
//   await MultiDataConsumerImpl.waitForDeployment();
//   const MultiDataConsumerAddress = await MultiDataConsumerImpl.getAddress();
//   console.log("MultiDataConsumerAddress : ", MultiDataConsumerAddress);

//   const encodedInitializeData =
//     MultiDataConsumerImpl.interface.encodeFunctionData("initialize", [
//       admin.address,
//     ]);

//   const MultiDataConsumerProxyImpl = await ethers.deployContract(
//     "MultiDataConsumerV3Proxy",
//     [MultiDataConsumerAddress, owner.address, encodedInitializeData]
//   );
//   await MultiDataConsumerProxyImpl.waitForDeployment();
//   const MultiDataConsumerProxyAddress =
//     await MultiDataConsumerProxyImpl.getAddress();
//   console.log(
//     "MultiDataConsumerProxyAddress : ",
//     MultiDataConsumerProxyAddress
//   );

//   const swapStorageImpl = await ethers.deployContract("BittoSwapStorage", [
//     owner.address,
//   ]);
//   await swapStorageImpl.waitForDeployment();
//   const swapStorageAddress = await swapStorageImpl.getAddress();

//   console.log("swapStorageAddress : ", swapStorageAddress);

//   const BittoSwapV1Impl = await ethers.deployContract("bittoSwapV1");
//   await BittoSwapV1Impl.waitForDeployment();
//   const swapAddress = await BittoSwapV1Impl.getAddress();

//   const encodedInitializeSwapData =
//     BittoSwapV1Impl.interface.encodeFunctionData("initialize", [
//       MultiDataConsumerProxyAddress,
//       swapStorageAddress,
//       admin.address,
//     ]);

//   const BittoSwapProxyImpl = await ethers.deployContract("BittoSwapProxy", [
//     swapAddress,
//     owner.address,
//     encodedInitializeSwapData,
//   ]);

//   await BittoSwapProxyImpl.waitForDeployment();

//   const swapProxyAddress = await BittoSwapProxyImpl.getAddress();

//   const MockToken1Impl = await ethers.deployContract("MockToken", [
//     "mock",
//     "mock",
//   ]);
//   await MockToken1Impl.waitForDeployment();
//   const MockToken1Address = await MockToken1Impl.getAddress();

//   const MockToken2Impl = await ethers.deployContract("MockToken", [
//     "mock",
//     "mock",
//   ]);
//   await MockToken2Impl.waitForDeployment();
//   const MockToken2Address = await MockToken2Impl.getAddress();

//   const MockToken3Impl = await ethers.deployContract("MockToken", [
//     "mock",
//     "mock",
//   ]);
//   await MockToken3Impl.waitForDeployment();
//   const MockToken3Address = await MockToken3Impl.getAddress();

//   const MockToken4Impl = await ethers.deployContract("MockToken", [
//     "mock",
//     "mock",
//   ]);
//   await MockToken4Impl.waitForDeployment();
//   const MockToken4Address = await MockToken4Impl.getAddress();

//   const MockToken5Impl = await ethers.deployContract("MockToken", [
//     "mock",
//     "mock",
//   ]);
//   await MockToken5Impl.waitForDeployment();
//   const MockToken5Address = await MockToken5Impl.getAddress();

//   console.log(
//     "token Address : ",
//     MockToken1Address,
//     MockToken2Address,
//     MockToken3Address,
//     MockToken4Address,
//     MockToken5Address
//   );

//   return {
//     MultiDataConsumerImpl,
//     MultiDataConsumerAddress,
//     MultiDataConsumerProxyImpl,
//     MultiDataConsumerProxyAddress,
//     swapStorageImpl,
//     swapStorageAddress,
//     BittoSwapV1Impl,
//     swapAddress,
//     BittoSwapProxyImpl,
//     swapProxyAddress,
//     MockToken1Impl,
//     MockToken2Impl,
//     MockToken3Impl,
//     MockToken4Impl,
//     MockToken5Impl,
//     MockToken1Address,
//     MockToken2Address,
//     MockToken3Address,
//     MockToken4Address,
//     MockToken5Address,
//     btcUsdAddress,
//     daiUsdAddress,
//     ethUsdAddress,
//     linkUsdAddress,
//     usdcUsdAddress,
//     owner,
//     user,
//     admin,
//   };
// }

// describe("MultiDataConsumerV3 and BittoSwapV1", function () {
//   this.timeout(1200000);
//   let MultiDataConsumerImpl,
//     MultiDataConsumerAddress,
//     MultiDataConsumerProxyImpl,
//     MultiDataConsumerProxyAddress,
//     BittoSwapV1Impl,
//     swapAddress,
//     BittoSwapProxyImpl,
//     swapProxyAddress,
//     MockToken1Impl,
//     MockToken1Address,
//     MockToken2Address,
//     MockToken3Address,
//     MockToken4Address,
//     btcUsdAddress,
//     daiUsdAddress,
//     ethUsdAddress,
//     linkUsdAddress,
//     usdcUsdAddress,
//     owner,
//     user,
//     admin;
//   before(async function () {
//     const deployment = await loadFixture(deployFixture);
//     MultiDataConsumerImpl = deployment.MultiDataConsumerImpl;
//     MultiDataConsumerAddress = deployment.MultiDataConsumerAddress;
//     MultiDataConsumerProxyImpl = deployment.MultiDataConsumerProxyImpl;
//     MultiDataConsumerProxyAddress = deployment.MultiDataConsumerProxyAddress;
//     BittoSwapV1Impl = deployment.BittoSwapV1Impl;
//     BittoSwapProxyImpl = deployment.BittoSwapProxyImpl;
//     swapAddress = deployment.swapAddress;
//     swapProxyAddress = deployment.swapProxyAddress;
//     MockToken1Impl = deployment.MockToken1Impl;
//     MockToken1Address = deployment.MockToken1Address;
//     MockToken2Address = deployment.MockToken2Address;
//     MockToken3Address = deployment.MockToken3Address;
//     MockToken4Address = deployment.MockToken4Address;
//     btcUsdAddress = deployment.btcUsdAddress;
//     daiUsdAddress = deployment.daiUsdAddress;
//     ethUsdAddress = deployment.ethUsdAddress;
//     linkUsdAddress = deployment.linkUsdAddress;
//     usdcUsdAddress = deployment.usdcUsdAddress;
//     (owner = deployment.owner),
//       (user = deployment.user),
//       (admin = deployment.admin);
//   });

//   //   describe("MultiDataConsumerV3", function () {
//   it("Should set the price feed correctly and return the latest price", async function () {
//     // Set the price feed for a token (mock token address used here)
//     console.log("owner : ", owner.address);
//     console.log("admin : ", admin.address);
//     const multiDataConsumer = await ethers.getContractAt(
//       "MultiDataConsumerV3",
//       MultiDataConsumerProxyAddress
//     );

//     await multiDataConsumer
//       .connect(admin)
//       .setPriceFeed(MockToken1Address, btcUsdAddress);

//     // Get the latest price (this will fail if the mock price feed doesn't behave as expected)
//     const latestPrice = await multiDataConsumer.getLatestPrice(
//       MockToken1Address
//     );
//     // Print out the returned value
//     console.log(`The latest price is: ${latestPrice.toString()}`);

//     expect(latestPrice).to.not.equal(0); // Or any other assertion that makes sense depending on your mock
//   });
//   //   });

//   it("Should add a pair and perform a swap", async function () {
//     // Pair 추가
//     // const { owner, user } = await getSigners();
//     const BittoSwapV1 = new ethers.Contract(
//       swapProxyAddress,
//       BittoSwapV1Impl.interface,
//       admin
//     );

//     await BittoSwapV1.addPair(
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
