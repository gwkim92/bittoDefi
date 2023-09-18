// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        // 토큰 총량 및 초기 발행 계정 설정
        _mint(msg.sender, 1000000000000000000000000); // 총 1,000,000 토큰 발행 (소수점 18자리)
    }

    // 특별한 추가 기능이 필요한 경우 여기에 구현할 수 있습니다.
}
