// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./LiquidityNFT.sol";
import "../priceOracle/MultiDataConsumerV3.sol";

contract BittoSwapPool is Initializable {
    IERC20 public token0;
    IERC20 public token1;
    LiquidityNFT public liquidityNFT;
    IERC20 public rewardToken;
    IMultiDataConsumerV3 public priceOracle;

    uint256 private totalLiqudity;
    uint256 public reserve0;
    uint256 public reserve1;

    // Mapping to keep track of the last block number when each user claimed rewards.
    mapping(uint => uint) private lastClaimedBlockNumber;

    int constant deviationTolerance = 1; // This value should be set according to your requirements.

    event LiqudityAdded(address indexed provider, uint amountA, uint amountB);
    event LiquidityRemoved(address indexed provider, uint tokenId);

    function initialize(
        address _token0,
        address _token1,
        address _liqudityNFTAddress,
        address _rewardToken,
        address _priceOracle,
        address _swapContract
    ) external initializer {
        token0 = IERC20(_token0);
        token1 = IERC20(_token1);
        liquidityNFT = LiquidityNFT(_liqudityNFTAddress);
        rewardToken = IERC20(_rewardToken);
        priceOracle = IMultiDataConsumerV3(_priceOracle);
        require(
            token0.approve(_swapContract, type(uint256).max),
            "Token0 approval failed"
        );
        require(
            token1.approve(_swapContract, type(uint256).max),
            "Token0 approval failed"
        );
    }

    function provideLiquidity(uint amountA, uint amountB) external {
        require(
            amountA > 0 && amountB > 0,
            "Provided liquidity must be greater than 0"
        );

        if (totalLiqudity == 0) {
            int latestTokenAPrice = priceOracle.getLatestPrice(address(token0));
            int latestTokenBPrice = priceOracle.getLatestPrice(address(token1));

            require(
                latestTokenAPrice > 0 && latestTokenBPrice > 0,
                "Invalid oracle prices"
            );

            // Calculate the expected ratio based on oracle prices.
            int expectedRatio = (latestTokenAPrice * int(amountA)) /
                (latestTokenBPrice * int(amountB));

            require(
                expectedRatio <= deviationTolerance,
                "Provided amounts do not match expected ratio"
            );
        }

        // Transfer token A from the user to this contract.
        require(
            token0.transferFrom(msg.sender, address(this), amountA),
            "Transfer of Token A failed"
        );

        // Transfer token B from the user to this contract.
        require(
            token1.transferFrom(msg.sender, address(this), amountB),
            "Transfer of Token B failed"
        );

        reserve0 += amountA;
        reserve1 += amountB;
        totalLiqudity += (amountA + amountB);
        liquidityNFT.mint(msg.sender, amountA, amountB);

        emit LiqudityAdded(msg.sender, amountA, amountB);
    }

    function removeLiquidity(uint tokenId) external {
        (uint userShareTokenA, uint userShareTokenB) = liquidityNFT
            .getLiqudityAmounts(tokenId);

        uint256 amounToReturnTokenA = userShareTokenA;
        uint256 amounToReturnTokenB = userShareTokenB;

        // Transfer the tokens back to the user.
        require(
            token0.transfer(msg.sender, amounToReturnTokenA),
            "Transfer of Token A failed"
        );

        require(
            token1.transfer(msg.sender, amounToReturnTokenB),
            "Transfer of Token B failed"
        );

        reserve0 -= amounToReturnTokenA;
        reserve1 -= amounToReturnTokenB;
        totalLiqudity -= (amounToReturnTokenA + amounToReturnTokenB);

        // Burn NFT representing the removed liquidity
        liquidityNFT.burn(tokenId);

        emit LiquidityRemoved(msg.sender, tokenId);
    }

    function claimRewards(uint tokenId) external {
        require(
            liquidityNFT.ownerOf(tokenId) == msg.sender,
            "Caller is not owner of this token"
        );

        if (lastClaimedBlockNumber[tokenId] == 0) {
            lastClaimedBlockNumber[tokenId] = block.number;
        }

        //numberOfBlocks: 마지막으로 보상을 청구한 블록과 현재 블록 사이의 차이
        uint numberOfBlocks = block.number - lastClaimedBlockNumber[tokenId];

        //rewardPerBlock: 블록당 보상금
        uint rewardPerBlock = 1e18;

        //totalSupply: 전체 유동성 공급량
        uint totalSupply = liquidityNFT.totalSupply();

        //userLiquidity: 사용자의 유동성 공급량
        uint userLiquidity = liquidityNFT.getTotalLiqudityAmounts(tokenId);

        //userReward: 사용자에게 지급할 보상금
        uint userReward = ((rewardPerBlock * numberOfBlocks) * userLiquidity) /
            totalSupply;

        // Update the last claimed block number.
        lastClaimedBlockNumber[tokenId] = block.number;

        require(userReward > 0, "No rewards to claim.");

        // Transfer the rewards.
        require(
            rewardToken.transfer(msg.sender, userReward),
            "Reward transfer failed."
        );
    }

    // Helper function to calculate absolute value of an integer.
    function abs(int x) internal pure returns (int) {
        return x >= 0 ? x : -x;
    }

    function updateReserves(uint256 _reserve0, uint256 _reserve1) external {
        // require(
        //     msg.sender == address(factory),
        //     "Only factory can update reserves"
        // );
        reserve0 = _reserve0;
        reserve1 = _reserve1;
    }
}

// // Romberg Integration method for rewards calculation

// 	function calculateRewards(uint tokenId) public view returns (uint256) {

// 		uint256 h = block.number.sub(lastClaimedBlockNumber[tokenId]);
// 		uint256 totalSupply = liquidityNFT.totalSupply();
// 		uint256 userLiquidity = liquidityNFT.getTotalLiqudityAmounts(tokenId);

// 		if (h == 0) return 0;

// 		uint256[] memory R = new uint[](h);

// 		for(uint i=0; i<h; i++) {
// 			R[i] = rewardPerBlock.mul(userLiquidity).div(totalSupply);
// 			userLiquidity += R[i];
// 			totalSupply += R[i];

// 			for(uint j=i-1; j>0; j--) {
// 				R[j] = ((uint(1)<<2*(i-j+1))*R[j+1]-R[j])/((uint(1)<<2*(i-j+1))-1);
// 			}

// 			R[0] = ((uint(1)<<2*i)*R[1]-R[0])/((uint(1)<<2*i)-1);

// 		}

// 	    return R[0].div(h);

// 	    // The above implementation uses the Romberg Integration method to calculate the rewards for a liquidity provider.
// 	    // It's a recursive method that uses the trapezoidal rule at step 0 and improves the approximation of integral using Richardson extrapolation.
// 	}
