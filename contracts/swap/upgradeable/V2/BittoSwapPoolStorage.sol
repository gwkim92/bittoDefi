// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-IERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IERC20Extended.sol"; // Import the interface here

contract BittoSwapPoolStorage is AccessControl {
    bytes32 public constant SWAP_ADMIN_ROLE = keccak256("SWAP_ADMIN_ROLE");

    // 상태 변수 설정
    uint256 public totalSwaps; // 총 스왑 횟수

    struct Swap {
        address user;
        uint256 amountIn;
        uint256 amountOut;
        uint256 timestamp;
    }

    struct Pair {
        IERC20Extended token0;
        IERC20Extended token1;
        uint reserve0;
        uint reserve1;
    }

    mapping(address => mapping(address => Pair)) public pairs;

    // 스왑 기록을 저장하기 위한 매핑
    mapping(uint256 => Swap) public swaps;

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    modifier onlySwapAdmin() {
        require(hasRole(SWAP_ADMIN_ROLE, _msgSender()), "Not a Swap Admin");
        _;
    }

    // 스왑 기록 추가 함수
    function addSwap(
        address user,
        uint256 amountIn,
        uint256 amountOut,
        uint256 timestamp
    ) external onlySwapAdmin {
        totalSwaps++;
        swaps[totalSwaps] = Swap(user, amountIn, amountOut, timestamp);
    }
}
