// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../pool/BittoPoolFactory.sol";
import "../pool/BittoSwapPool.sol";

contract BittoSwapContract is ReentrancyGuard, Pausable, Ownable {
    using SafeMath for uint256;

    event Swap(
        address indexed sender,
        address indexed tokenIn,
        address indexed tokenOut,
        uint amountIn,
        uint amountOut,
        address poolAddress
    );

    BittoPoolFactory public factory;
    IMultiDataConsumerV3 public priceOracle;

    constructor(BittoPoolFactory _factory, address _priceOracle) {
        factory = _factory;
        priceOracle = IMultiDataConsumerV3(_priceOracle);
    }

    function swap(
        uint amountIn,
        uint minAmountOut,
        address _tokenIn,
        address _tokenOut
    ) external whenNotPaused nonReentrant {
        // Check if input and output tokens are not the same.
        require(
            _tokenIn != _tokenOut,
            "Input and output tokens cannot be the same"
        );

        // Get the pool for these tokens.
        address poolAddress = factory.getPool(_tokenIn, _tokenOut);
        require(poolAddress != address(0), "Pool does not exist");

        // Ensure that the tokens are part of this pool.
        BittoSwapPool pool = BittoSwapPool(poolAddress);

        require(
            (_tokenIn == address(pool.token0()) &&
                _tokenOut == address(pool.token1())) ||
                (_tokenIn == address(pool.token1()) &&
                    _tokenOut == address(pool.token0())),
            "Invalid input/output tokens"
        );

        int latestPriceTokenA = priceOracle.getLatestPrice(address(_tokenIn));
        int latestPriceTokenB = priceOracle.getLatestPrice(address(_tokenOut));

        require(
            latestPriceTokenA > 0 && latestPriceTokenB > 0,
            "Invalid oracle prices"
        );

        uint256 outputAmount;

        if (_tokenIn == address(pool.token0())) {
            uint256 amountInPrice = amountIn.mul(uint256(latestPriceTokenA));
            outputAmount = amountInPrice.div(uint256(latestPriceTokenB));
        } else {
            uint256 amountInPrice = amountIn.mul(uint256(latestPriceTokenB));
            outputAmount = amountInPrice.div(uint256(latestPriceTokenA));
        }

        require(outputAmount >= minAmountOut, "Insufficient output amount");

        // Ensure the contract has enough allowance to perform the transfer.
        require(
            IERC20(_tokenIn).allowance(msg.sender, address(this)) >= amountIn,
            "Check the token allowance"
        );

        // Transfer from sender to pool.
        IERC20(_tokenIn).transferFrom(msg.sender, poolAddress, amountIn);

        // Update reserves in the pool.
        if (_tokenIn == address(pool.token0())) {
            pool.updateReserves(
                pool.reserve0().add(amountIn),
                pool.reserve1().sub(outputAmount)
            );
        } else {
            pool.updateReserves(
                pool.reserve0().sub(outputAmount),
                pool.reserve1().add(amountIn)
            );
        }
        // Ensure that pool has enough balance of token out
        require(
            IERC20(_tokenOut).balanceOf(poolAddress) >= outputAmount,
            "Insufficient balance in Pool"
        );

        IERC20(_tokenOut).transferFrom(poolAddress, msg.sender, outputAmount);

        emit Swap(
            msg.sender,
            _tokenIn,
            _tokenOut,
            amountIn,
            outputAmount,
            poolAddress
        ); // Include the poolAddress in the event
    }
}
