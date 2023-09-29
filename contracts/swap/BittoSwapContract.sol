// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../pool/BittoSwapFactory.sol";
import "../pool/BittoSwapPool.sol";

contract BittoSwapContract {
    event Swap(
        address indexed sender,
        address indexed tokenIn,
        address indexed tokenOut,
        uint amountIn,
        uint amountOut
    );

    BittoSwapFactory public factory;

    constructor(BittoSwapFactory _factory) {
        factory = _factory;
    }

    function swap(
        uint amountIn,
        uint minAmountOut,
        address _tokenIn,
        address _tokenOut
    ) external {
        address poolAddress = factory.getPool(_tokenIn, _tokenOut);
        require(poolAddress != address(0), "Pool does not exist");

        BittoSwapPool pool = BittoSwapPool(poolAddress);

        require(
            (_tokenIn == address(pool.token0()) &&
                _tokenOut == address(pool.token1())) ||
                (_tokenIn == address(pool.token1()) &&
                    _tokenOut == address(pool.token0())),
            "Invalid input/output tokens"
        );

        uint256 outputAmount;
        uint256 newReserve0;
        uint256 newReserve1;

        // Calculate output amount based on reserves and input amount
        if (_tokenIn == address(pool.token0())) {
            outputAmount =
                (pool.reserve1() * amountIn) /
                (pool.reserve0() + amountIn);
            newReserve0 = pool.reserve0() + amountIn;
            newReserve1 = pool.reserve1() - outputAmount;
        } else {
            outputAmount =
                (pool.reserve0() * amountIn) /
                (pool.reserve1() + amountIn);
            newReserve0 = pool.reserve0() - outputAmount;
            newReserve1 = pool.reserve1() + amountIn;
        }

        require(outputAmount >= minAmountOut, "Insufficient output amount");

        // Transfer tokens to pool contract
        IERC20(_tokenIn).transferFrom(msg.sender, poolAddress, amountIn);

        // Update reserves in the pool
        pool.updateReserves(newReserve0, newReserve1);

        // Transfer output tokens to the user
        IERC20(_tokenOut).transfer(msg.sender, outputAmount);

        emit Swap(msg.sender, _tokenIn, _tokenOut, amountIn, outputAmount);
    }
}
