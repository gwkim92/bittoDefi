// IERC20Extended.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/extensions/draft-IERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IERC20Extended is IERC20, IERC20Permit {
    function decimals() external view returns (uint8);
}
