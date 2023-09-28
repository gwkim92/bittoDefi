// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./LiquidityNFT.sol";
import "../priceOracle/MultiDataConsumerV3.sol";

contract BittoSwapPool is Ownable {
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

    int constant deviationTolerance = 5; // This value should be set according to your requirements.

    event LiqudityAdded(address indexed provider, uint amountA, uint amountB);
    event LiquidityRemoved(address indexed provider, uint tokenId);

    function initialize(
        address _token0,
        address _token1,
        address _liqudityNFTAddress,
        address _rewardToken,
        address _priceOracle
    ) external onlyOwner {
        token0 = IERC20(_token0);
        token1 = IERC20(_token1);
        liquidityNFT = LiquidityNFT(_liqudityNFTAddress);
        rewardToken = IERC20(_rewardToken);
        priceOracle = IMultiDataConsumerV3(_priceOracle);
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
                abs(expectedRatio - int(amountA / amountB)) <=
                    deviationTolerance,
                "Provided amounts do not match expected ratio"
            );
        } else {
            // Calculate the current pool's ratio.
            int currentRatio = (int(reserve0) * int(amountA)) /
                (int(reserve1) * int(amountB));

            require(
                abs(currentRatio - int(amountA / amountB)) <=
                    deviationTolerance,
                "Provided amounts do not match pool's ratio"
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

        liquidityNFT.mint(msg.sender, (amountA + amountB));

        emit LiqudityAdded(msg.sender, amountA, amountB);
    }

    function removeLiquidity(uint tokenId) external {
        uint256 userShare = liquidityNFT.getLiquidity(tokenId);

        require(userShare > 0, "No liquidity found");

        uint256 amounToReturnTokenA = (reserve0 * userShare) / totalLiqudity;
        uint256 amounToReturnTokenB = (reserve1 * userShare) / totalLiqudity;

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
        uint userLiquidity = liquidityNFT.getLiquidity(tokenId);
        //userReward: 사용자에게 지급할 보상금
        uint userReward = ((rewardPerBlock * numberOfBlocks) * userLiquidity) /
            totalSupply;

        // Update the last claimed block number.
        lastClaimedBlockNumber[tokenId] = block.number;

        require(userReward > 0, "No rewards to claim.");
        require(
            rewardToken.transfer(msg.sender, userReward),
            "Reward transfer failed."
        );

        // Transfer the rewards.
        rewardToken.transfer(msg.sender, userReward);
    }

    // Helper function to calculate absolute value of an integer.
    function abs(int x) internal pure returns (int) {
        return x >= 0 ? x : -x;
    }
}
