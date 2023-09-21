// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-IERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./BittoSwapPoolStorage.sol";
import "./IERC20Extended.sol"; // Import the interface here

contract BittoSwapPool is OwnableUpgradeable, PausableUpgradeable {
    // using SafeMathUpgradeable for uint;
    BittoSwapPoolStorage public swapStorage; // Add storage contract state variable
    IERC20Extended public token0;
    IERC20Extended public token1;

    uint public reserve0;
    uint public reserve1;

    event Swap(
        address indexed sender,
        address indexed tokenIn,
        address indexed tokenOut,
        uint amountIn,
        uint amountOut
    );

    function initialize(
        IERC20Extended _token0,
        IERC20Extended _token1,
        uint _reserve0,
        uint _reserve1,
        BittoSwapPoolStorage _swapStorage
    ) public initializer {
        __Pausable_init();
        __Ownable_init();

        token0 = _token0;
        token1 = _token1;

        reserve0 = normalizeReserve(_reserve0, token0.decimals());
        reserve1 = normalizeReserve(_reserve1, token1.decimals());
        swapStorage = _swapStorage;
    }

    // Swap function
    function swap(
        uint amountIn,
        address _tokenIn,
        address _tokenOut
    ) external whenNotPaused {
        require(
            (_tokenIn == address(token0) && _tokenOut == address(token1)) ||
                (_tokenIn == address(token1) && _tokenOut == address(token0)),
            "Invalid input/output tokens"
        );

        // Transfer tokens to this contract
        require(
            IERC20(_tokenIn).transferFrom(msg.sender, address(this), amountIn),
            "Transfer failed"
        );

        // Calculate output amount based on reserves and input amount
        uint outputAmount = getOutputAmount(amountIn);

        // Transfer output tokens back to sender
        require(
            IERC20(_tokenOut).transfer(msg.sender, outputAmount),
            "Transfer failed"
        );

        updateReserves();

        emit Swap(msg.sender, _tokenIn, _tokenOut, amountIn, outputAmount);
        swapStorage.addSwap(
            msg.sender,
            amountIn,
            outputAmount,
            block.timestamp
        );
    }

    // Update reserves based on current balances
    function updateReserves() internal {
        reserve0 = token0.balanceOf(address(this));
        reserve1 = token1.balanceOf(address(this));
    }

    // Get output amount based on input amount and reserves ratio
    function getOutputAmount(uint inputAmount) internal view returns (uint) {
        return (reserve1 * (inputAmount)) / (reserve0); // example of a simple pricing algorithm based on reserves ratio.
    }

    // Normalize reserves to have the same decimal places
    function normalizeReserve(
        uint amount,
        uint8 decimals
    ) internal pure returns (uint) {
        if (decimals < 18) {
            return amount * (10 ** (18 - decimals));
        } else if (decimals > 18) {
            return amount / (10 ** (decimals - 18));
        } else {
            return amount;
        }
    }
}
