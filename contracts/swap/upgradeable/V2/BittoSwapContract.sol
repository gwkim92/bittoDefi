// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./BittoSwapPool.sol";

contract BittoSwapContract {
    BittoSwapPool public swapPool;

    constructor(address _swapPoolAddress) {
        swapPool = BittoSwapPool(_swapPoolAddress);
    }

    function swap(uint amountIn, address _tokenIn, address _tokenOut) external {
        require(
            (_tokenIn == address(swapPool.token0()) &&
                _tokenOut == address(swapPool.token1())) ||
                (_tokenIn == address(swapPool.token1()) &&
                    _tokenOut == address(swapPool.token0())),
            "Invalid input/output tokens"
        );

        // Transfer tokens to this contract
        require(
            IERC20(_tokenIn).transferFrom(msg.sender, address(this), amountIn),
            "Transfer failed"
        );

        // Calculate output amount based on reserves and input amount
        uint outputAmount;

        if (_tokenIn == address(swapPool.token0())) {
            outputAmount =
                (swapPool.reserve1() * amountIn) /
                (swapPool.reserve0() + amountIn);

            // Transfer the corresponding amount of Token B back to the user.
            require(
                IERC20(_tokenOut).transfer(msg.sender, outputAmount),
                "Transfer failed"
            );

            // Now we can add the received Token A to the pool's reserves.
            IERC20(_tokenIn).transfer(address(swapPool), amountIn);
        } else {
            outputAmount =
                (swapPool.reserve0() * amountIn) /
                (swapPool.reserve1() + amountIn);

            // Transfer the corresponding amount of Token A back to the user.
            require(
                IERC20(_tokenOut).transfer(msg.sender, outputAmount),
                "Transfer failed"
            );

            // Now we can add the received Token B to the pool's reserves.
            IERC20(_tokenIn).transfer(address(swapPool), amountIn);
        }
    }
}
