// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

contract BittoSwapStorage {
    // 상태 변수 설정
    uint256 public totalSwaps; // 총 스왑 횟수
    address public admin; // 관리자 주소

    // 스왑 기록을 저장하기 위한 매핑
    mapping(uint256 => Swap) public swaps;

    struct Swap {
        address user;
        uint256 amountIn;
        uint256 amountOut;
        uint256 timestamp;
    }

    // 생성자 함수
    constructor(address _admin) {
        admin = _admin;
    }

    // 스왑 기록 추가 함수
    function addSwap(
        address user,
        uint256 amountIn,
        uint256 amountOut,
        uint256 timestamp
    ) external {
        require(msg.sender == admin, "Only admin can add swaps");
        totalSwaps++;
        swaps[totalSwaps] = Swap(user, amountIn, amountOut, timestamp);
    }
}
