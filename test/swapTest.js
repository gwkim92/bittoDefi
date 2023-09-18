const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BittoSwapV2", function () {
  let owner;
  let user;
  let bittoSwapV2;
  let priceOracle;
  let mockToken0;
  let mockToken1;
  let mockToken2;
  let mockToken3;
  let mockToken4;

  // 환경 변수에서 주소 가져오기
  const btcUsdAddress = process.env.BTCUSDADDRESS;
  const daiUsdAddress = process.env.DAIUSDADDRESS;
  const ethUsdAddress = process.env.ETHUSDADDRESS;
  const linkUsdAddress = process.env.LINKUSDADDRESS;
  const usdcUsdAddress = process.env.USDCUSDADDRESS;

  before(async function () {
    // 계정 설정 및 배포
    [owner, user] = await ethers.getSigners();

    const BittoSwapV2 = await ethers.getContractFactory("bittoSwapV1");
    bittoSwapV2 = await BittoSwapV2.deploy(/* constructor arguments */);
    await bittoSwapV2.deployed();

    // Price Oracle 컨트랙트 배포 및 설정
    const MultiDataConsumerV3 = await ethers.getContractFactory(
      "MultiDataConsumerV3"
    );
    priceOracle = await MultiDataConsumerV3.deploy();
    await priceOracle.deployed();

    await bittoSwapV2.initialize(
      priceOracle.address /* other initialization parameters */
    );

    // Mock 토큰 생성 및 소유권 설정
    const MockToken = await ethers.getContractFactory("MockToken");
    mockToken0 = await MockToken.deploy("Token0", "TK0");
    await mockToken0.deployed();

    mockToken1 = await MockToken.deploy("Token1", "TK1");
    await mockToken1.deployed();

    mockToken2 = await MockToken.deploy("Token2", "TK2");
    await mockToken2.deployed();

    mockToken3 = await MockToken.deploy("Token3", "TK3");
    await mockToken3.deployed();

    mockToken4 = await MockToken.deploy("Token4", "TK4");
    await mockToken4.deployed();

    // Mock 토큰을 스왑 컨트랙트에 보내기
    await mockToken0.transfer(
      bittoSwapV2.address,
      ethers.utils.parseEther("1000")
    );
    await mockToken1.transfer(
      bittoSwapV2.address,
      ethers.utils.parseEther("1000")
    );
    await mockToken2.transfer(
      bittoSwapV2.address,
      ethers.utils.parseEther("1000")
    );
    await mockToken3.transfer(
      bittoSwapV2.address,
      ethers.utils.parseEther("1000")
    );
    await mockToken4.transfer(
      bittoSwapV2.address,
      ethers.utils.parseEther("1000")
    );
  });

  it("Should add a pair and perform a swap", async function () {
    // Pair 추가
    const token0 = mockToken0.address;
    const token1 = mockToken1.address;
    const feedAddress0 = btcUsdAddress; // BTC USD Oracle 주소
    const feedAddress1 = daiUsdAddress; // DAI USD Oracle 주소

    await bittoSwapV2
      .connect(owner)
      .addPair(token0, token1, feedAddress0, feedAddress1);

    // Swap 수행
    const amountIn = ethers.utils.parseEther("1"); // 1 ETH
    const tokenIn = token0;
    const tokenOut = token1;

    const initialBalanceUser = await mockToken1.balanceOf(user.address);
    await bittoSwapV2.connect(user).swap(amountIn, tokenIn, tokenOut);
    const finalBalanceUser = await mockToken1.balanceOf(user.address);

    // Swap 결과 검증
    expect(finalBalanceUser.gt(initialBalanceUser)).to.be.true;
  });

  it("Should pause and unpause the contract", async function () {
    // Pause 및 Unpause 테스트
    await bittoSwapV2.connect(owner).pause();

    const isPaused = await bittoSwapV2.paused();
    expect(isPaused).to.be.true;

    await bittoSwapV2.connect(owner).unpause();

    const isUnpaused = await bittoSwapV2.paused();
    expect(isUnpaused).to.be.false;
  });

  it("Should prevent non-admin from adding a pair", async function () {
    // Non-admin 계정으로 pair 추가 시도
    const nonAdmin = user;

    const token0 = mockToken0.address;
    const token1 = mockToken1.address;
    const feedAddress0 = btcUsdAddress; // BTC USD Oracle 주소
    const feedAddress1 = daiUsdAddress; // DAI USD Oracle 주소

    await expect(
      bittoSwapV2
        .connect(nonAdmin)
        .addPair(token0, token1, feedAddress0, feedAddress1)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should revert when swapping with insufficient balance", async function () {
    // 스왑할 잔액 부족 시도
    const amountIn = ethers.utils.parseEther("10"); // 10 ETH (컨트랙트의 보유 잔액보다 많은 양)

    const token0 = mockToken0.address;
    const token1 = mockToken1.address;

    await expect(
      bittoSwapV2.connect(user).swap(amountIn, token0, token1)
    ).to.be.revertedWith("Insufficient balance");
  });

  it("Should revert when adding a pair with invalid oracle prices", async function () {
    // 유효하지 않은 Oracle 가격으로 pair 추가 시도
    const token0 = mockToken0.address;
    const token1 = mockToken1.address;
    const feedAddress0 = ethUsdAddress; // 유효하지 않은 Oracle 주소
    const feedAddress1 = linkUsdAddress; // 유효하지 않은 Oracle 주소

    await expect(
      bittoSwapV2
        .connect(owner)
        .addPair(token0, token1, feedAddress0, feedAddress1)
    ).to.be.revertedWith("Invalid oracle prices");
  });

  it("Should update reserves and prices correctly", async function () {
    // Pair 추가
    const token0 = mockToken0.address;
    const token1 = mockToken1.address;
    const feedAddress0 = btcUsdAddress; // BTC USD Oracle 주소
    const feedAddress1 = daiUsdAddress; // DAI USD Oracle 주소

    await bittoSwapV2
      .connect(owner)
      .addPair(token0, token1, feedAddress0, feedAddress1);

    // Swap 수행
    const amountIn = ethers.utils.parseEther("1"); // 1 ETH
    const tokenIn = token0;
    const tokenOut = token1;

    const initialReserve1 = await bittoSwapV2.getReserves(token1, token0);

    await bittoSwapV2.connect(user).swap(amountIn, tokenIn, tokenOut);

    const finalReserve0 = await bittoSwapV2.getReserves(token0, token1);
    const finalReserve1 = await bittoSwapV2.getReserves(token1, token0);

    // Swap 후 reserve 및 price 업데이트 검증
    expect(finalReserve0.reserve0.gt(initialReserve0.reserve0)).to.be.true;
    expect(finalReserve0.reserve1.lt(initialReserve0.reserve1)).to.be.true;
    expect(finalReserve1.reserve1.gt(initialReserve1.reserve1)).to.be.true;
    expect(finalReserve1.reserve0.lt(initialReserve1.reserve0)).to.be.true;
  });

  it("Should update swap storage correctly", async function () {
    // Pair 추가
    const token0 = mockToken0.address;
    const token1 = mockToken1.address;
    const feedAddress0 = btcUsdAddress; // BTC USD Oracle 주소
    const feedAddress1 = daiUsdAddress; // DAI USD Oracle 주소

    await bittoSwapV2
      .connect(owner)
      .addPair(token0, token1, feedAddress0, feedAddress1);

    // Swap 수행
    const amountIn = ethers.utils.parseEther("1"); // 1 ETH
    const tokenIn = token0;
    const tokenOut = token1;

    const initialSwapCount = await bittoSwapV2.swapStorage.totalSwaps();

    await bittoSwapV2.connect(user).swap(amountIn, tokenIn, tokenOut);

    const finalSwapCount = await bittoSwapV2.swapStorage.totalSwaps();

    // Swap 후 swap storage 업데이트 검증
    expect(finalSwapCount.eq(initialSwapCount.add(1))).to.be.true;
  });

  it("Should handle multiple pairs and swaps correctly", async function () {
    // 여러 개의 페어 추가
    const token0 = mockToken0.address;
    const token1 = mockToken1.address;
    const feedAddress0 = btcUsdAddress; // BTC USD Oracle 주소
    const feedAddress1 = daiUsdAddress; // DAI USD Oracle 주소

    const token2 = mockToken2.address;
    const token3 = mockToken3.address;
    const feedAddress2 = ethUsdAddress; // ETH USD Oracle 주소
    const feedAddress3 = usdcUsdAddress; // USDC USD Oracle 주소

    await bittoSwapV2
      .connect(owner)
      .addPair(token0, token1, feedAddress0, feedAddress1);
    await bittoSwapV2
      .connect(owner)
      .addPair(token2, token3, feedAddress2, feedAddress3);

    // Swap 수행
    const amountIn1 = ethers.utils.parseEther("1"); // 1 ETH
    const amountIn2 = ethers.utils.parseEther("2"); // 2 ETH
    const tokenIn1 = token0;
    const tokenOut1 = token1;
    const tokenIn2 = token2;
    const tokenOut2 = token3;

    const initialBalanceUser = await mockToken1.balanceOf(user.address);
    await bittoSwapV2.connect(user).swap(amountIn1, tokenIn1, tokenOut1);
    await bittoSwapV2.connect(user).swap(amountIn2, tokenIn2, tokenOut2);
    const finalBalanceUser = await mockToken1.balanceOf(user.address);

    // Swap 결과 검증
    const expectedBalance = initialBalanceUser
      .add(amountIn1) // 첫 번째 스왑
      .add(amountIn2); // 두 번째 스왑

    expect(finalBalanceUser.eq(expectedBalance)).to.be.true;
  });

  it("Should prevent unauthorized access to pause and unpause functions", async function () {
    // Pause 및 Unpause에 권한 없이 시도
    const nonAdmin = user;

    await expect(bittoSwapV2.connect(nonAdmin).pause()).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );

    await expect(bittoSwapV2.connect(nonAdmin).unpause()).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
  });

  it("Should handle edge cases for swapping", async function () {
    // 스왑 엣지 케이스 처리
    const amountIn = ethers.utils.parseEther("1"); // 1 ETH
    const token0 = mockToken0.address;
    const token1 = mockToken1.address;

    // 컨트랙트에 보유 토큰 잔액이 없는 경우 스왑 시도
    await expect(
      bittoSwapV2.connect(user).swap(amountIn, token0, token1)
    ).to.be.revertedWith("Transfer failed");
  });
});
