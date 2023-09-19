const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
//swap 기능 테스트

async function getSigners() {
  const [owner, user, recipient, admin] = await ethers.getSigners();
  return { owner, user, recipient, admin };
}

async function deployFixture() {
  //배포 순서
  // erc20 deploy 0,1,2,3,4

  const { owner, user } = await getSigners();

  // 환경 변수에서 주소 가져오기
  const btcUsdAddress = process.env.BTCUSDADDRESS;
  const daiUsdAddress = process.env.DAIUSDADDRESS;
  const ethUsdAddress = process.env.ETHUSDADDRESS;
  const linkUsdAddress = process.env.LINKUSDADDRESS;
  const usdcUsdAddress = process.env.USDCUSDADDRESS;

  const MultiDataConsumerImpl = await ethers.deployContract(
    "MultiDataConsumerV3"
  );
  await MultiDataConsumerImpl.waitForDeployment();
  const MultiDataConsumerAddress = await MultiDataConsumerImpl.getAddress();
  console.log("MultiDataConsumerAddress : ", MultiDataConsumerAddress);

  const encodedInitializeData =
    MultiDataConsumerImpl.interface.encodeFunctionData("initialize");

  const MultiDataConsumerProxyImpl = await ethers.deployContract(
    "MultiDataConsumerV3Proxy",
    [MultiDataConsumerAddress, owner.address, encodedInitializeData]
  );
  await MultiDataConsumerProxyImpl.waitForDeployment();
  const MultiDataConsumerProxyAddress =
    await MultiDataConsumerProxyImpl.getAddress();

  const swapStorageImpl = await ethers.deployContract(
    "BittoSwapStorage",
    owner.address
  );
  await swapStorageImpl.waitForDeployment();
  const swapStorageAddress = swapStorageImpl.getAddress();

  const BittoSwapV1Impl = await ethers.deployContract("bittoSwapV1");
  await BittoSwapV1Impl.waitForDeployment();
  const swapAddress = BittoSwapV1Impl.getAddress();

  const encodedInitializeSwapData =
    BittoSwapV1Impl.interface.encodeFunctionData("initialize", [
      MultiDataConsumerProxyAddress,
      swapStorageAddress,
    ]);

  const BittoSwapProxyImpl = await ethers.deployContract("BittoSwapProxy", [
    swapAddress,
    owner.address,
    encodedInitializeSwapData,
  ]);

  await BittoSwapProxyImpl.waitForDeployment();

  const swapProxyAddress = BittoSwapProxyImpl.getAddress();

  const MockToken1Impl = await ethers.deployContract("MockToken");
  await MockToken1Impl.waitForDeployment();
  const MockToken1Address = MockToken1Impl.getAddress();

  const MockToken2Impl = await ethers.deployContract("MockToken");
  await MockToken2Impl.waitForDeployment();
  const MockToken2Address = MockToken2Impl.getAddress();

  const MockToken3Impl = await ethers.deployContract("MockToken");
  await MockToken3Impl.waitForDeployment();
  const MockToken3Address = MockToken3Impl.getAddress();

  const MockToken4Impl = await ethers.deployContract("MockToken");
  await MockToken4Impl.waitForDeployment();
  const MockToken4Address = MockToken4Impl.getAddress();

  const MockToken5Impl = await ethers.deployContract("MockToken");
  await MockToken5Impl.waitForDeployment();
  const MockToken5Address = MockToken5Impl.getAddress();

  console.log(
    "address : ",
    MultiDataConsumerAddress,
    MultiDataConsumerProxyAddress,
    swapStorageAddress,
    swapAddress,
    swapProxyAddress,
    MockToken1Address,
    MockToken2Address,
    MockToken3Address,
    MockToken4Address,
    MockToken5Address
  );
  return {
    MultiDataConsumerImpl,
    MultiDataConsumerAddress,
    MultiDataConsumerProxyImpl,
    MultiDataConsumerProxyAddress,
    swapStorageImpl,
    swapStorageAddress,
    BittoSwapV1Impl,
    swapAddress,
    BittoSwapProxyImpl,
    swapProxyAddress,
    MockToken1Impl,
    MockToken2Impl,
    MockToken3Impl,
    MockToken4Impl,
    MockToken5Impl,
    MockToken1Address,
    MockToken2Address,
    MockToken3Address,
    MockToken4Address,
    MockToken5Address,
    btcUsdAddress,
    daiUsdAddress,
    ethUsdAddress,
    linkUsdAddress,
    usdcUsdAddress,
  };
}

describe("MultiDataConsumerV3 and BittoSwapV1", function () {
  let fixtures;
  let owner;
  let user;
  let bittoSwapV2;
  let mockToken0;
  let mockToken1;
  // 다른 필요한 변수 추가

  before(async function () {
    [owner, user] = await ethers.getSigners();
    fixtures = await loadFixture(deployFixture);

    bittoSwapV2 = fixtures.BittoSwapV1Impl;
    mockToken0 = fixtures.MockToken1Impl;
    mockToken1 = fixtures.MockToken2Impl;
    // 다른 변수 할당 추가
  });

  it("Should add a pair and perform a swap", async function () {
    // Pair 추가
    const token0 = fixtures.MockToken1Address;
    const token1 = fixtures.MockToken2Address;
    const feedAddress0 = fixtures.btcUsdAddress;
    const feedAddress1 = fixtures.daiUsdAddress;

    await bittoSwapV2
      .connect(owner)
      .addPair(token0, token1, feedAddress0, feedAddress1);

    // Swap 수행
    const amountIn = ethers.utils.parseEther("1");
    const tokenIn = token0;
    const tokenOut = token1;

    const initialBalanceUser = await mockToken1.balanceOf(user.address);
    await bittoSwapV2.connect(user).swap(amountIn, tokenIn, tokenOut);
    const finalBalanceUser = await mockToken1.balanceOf(user.address);

    expect(finalBalanceUser.gt(initialBalanceUser)).to.be.true;
  });

  it("Should pause and unpause the contract", async function () {
    await bittoSwapV2.connect(owner).pause();

    const isPaused = await bittoSwapV2.paused();
    expect(isPaused).to.be.true;

    await bittoSwapV2.connect(owner).unpause();

    const isUnpaused = await bittoSwapV2.paused();
    expect(isUnpaused).to.be.false;
  });

  it("Should prevent non-admin from adding a pair", async function () {
    const nonAdmin = user;

    const token0 = mockToken0.address;
    const token1 = mockToken1.address;
    const feedAddress0 = fixtures.btcUsdAddress;
    const feedAddress1 = fixtures.daiUsdAddress;

    await expect(
      bittoSwapV2
        .connect(nonAdmin)
        .addPair(token0, token1, feedAddress0, feedAddress1)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should revert when swapping with insufficient balance", async function () {
    const amountIn = ethers.utils.parseEther("10");

    const token0 = mockToken0.address;
    const token1 = mockToken1.address;

    await expect(
      bittoSwapV2.connect(user).swap(amountIn, token0, token1)
    ).to.be.revertedWith("Insufficient balance");
  });

  it("Should revert when adding a pair with invalid oracle prices", async function () {
    const token0 = mockToken0.address;
    const token1 = mockToken1.address;
    const feedAddress0 = fixtures.ethUsdAddress;
    const feedAddress1 = fixtures.linkUsdAddress;

    await expect(
      bittoSwapV2
        .connect(owner)
        .addPair(token0, token1, feedAddress0, feedAddress1)
    ).to.be.revertedWith("Invalid oracle prices");
  });

  it("Should update reserves and prices correctly", async function () {
    const token0 = mockToken0.address;
    const token1 = mockToken1.address;
    const feedAddress0 = fixtures.btcUsdAddress;
    const feedAddress1 = fixtures.daiUsdAddress;

    await bittoSwapV2
      .connect(owner)
      .addPair(token0, token1, feedAddress0, feedAddress1);

    const amountIn = ethers.utils.parseEther("1");
    const tokenIn = token0;
    const tokenOut = token1;

    const initialReserve1 = await bittoSwapV2.getReserves(token1, token0);

    await bittoSwapV2.connect(user).swap(amountIn, tokenIn, tokenOut);

    const finalReserve0 = await bittoSwapV2.getReserves(token0, token1);
    const finalReserve1 = await bittoSwapV2.getReserves(token1, token0);

    expect(finalReserve0.reserve0.gt(initialReserve0.reserve0)).to.be.true;
    expect(finalReserve0.reserve1.lt(initialReserve0.reserve1)).to.be.true;
    expect(finalReserve1.reserve1.gt(initialReserve1.reserve1)).to.be.true;
    expect(finalReserve1.reserve0.lt(initialReserve1.reserve0)).to.be.true;
  });

  it("Should update swap storage correctly", async function () {
    const token0 = mockToken0.address;
    const token1 = mockToken1.address;
    const feedAddress0 = fixtures.btcUsdAddress;
    const feedAddress1 = fixtures.daiUsdAddress;

    await bittoSwapV2
      .connect(owner)
      .addPair(token0, token1, feedAddress0, feedAddress1);

    const amountIn = ethers.utils.parseEther("1");
    const tokenIn = token0;
    const tokenOut = token1;

    const initialSwapCount = await bittoSwapV2.swapStorage.totalSwaps();

    await bittoSwapV2.connect(user).swap(amountIn, tokenIn, tokenOut);

    const finalSwapCount = await bittoSwapV2.swapStorage.totalSwaps();

    expect(finalSwapCount.eq(initialSwapCount.add(1))).to.be.true;
  });

  it("Should handle multiple pairs and swaps correctly", async function () {
    const token0 = mockToken0.address;
    const token1 = mockToken1.address;
    const feedAddress0 = fixtures.btcUsdAddress;
    const feedAddress1 = fixtures.daiUsdAddress;

    const token2 = fixtures.MockToken3Address;
    const token3 = fixtures.MockToken4Address;
    const feedAddress2 = fixtures.ethUsdAddress;
    const feedAddress3 = fixtures.usdcUsdAddress;

    await bittoSwapV2
      .connect(owner)
      .addPair(token0, token1, feedAddress0, feedAddress1);
    await bittoSwapV2
      .connect(owner)
      .addPair(token2, token3, feedAddress2, feedAddress3);

    const amountIn1 = ethers.utils.parseEther("1");
    const amountIn2 = ethers.utils.parseEther("2");
    const tokenIn1 = token0;
    const tokenOut1 = token1;
    const tokenIn2 = token2;
    const tokenOut2 = token3;

    const initialBalanceUser = await mockToken1.balanceOf(user.address);
    await bittoSwapV2.connect(user).swap(amountIn1, tokenIn1, tokenOut1);
    await bittoSwapV2.connect(user).swap(amountIn2, tokenIn2, tokenOut2);
    const finalBalanceUser = await mockToken1.balanceOf(user.address);

    const expectedBalance = initialBalanceUser
      .add(amountIn1) // 첫 번째 스왑
      .add(amountIn2); // 두 번째 스왑

    expect(finalBalanceUser.eq(expectedBalance)).to.be.true;
  });

  it("Should prevent unauthorized access to pause and unpause functions", async function () {
    const nonAdmin = user;

    await expect(bittoSwapV2.connect(nonAdmin).pause()).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );

    await expect(bittoSwapV2.connect(nonAdmin).unpause()).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
  });

  it("Should handle edge cases for swapping", async function () {
    const amountIn = ethers.utils.parseEther("1");
    const token0 = fixtures.MockToken1Address;
    const token1 = fixtures.MockToken2Address;

    // 컨트랙트에 보유 토큰 잔액이 없는 경우 스왑 시도
    await expect(
      bittoSwapV2.connect(user).swap(amountIn, token0, token1)
    ).to.be.revertedWith("Transfer failed");
  });
});
