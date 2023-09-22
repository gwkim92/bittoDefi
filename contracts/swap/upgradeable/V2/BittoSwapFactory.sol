// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "../../tokenPrice/MultiDataConsumerV3.sol";
import "./BittoSwapPoolProxy.sol";
import "./BittoSwapPool.sol";
import "./IERC20Extended.sol"; // Import the interface here

contract BittoSwapFactory is Ownable, AccessControl {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant SWAP_ADMIN_ROLE = keccak256("SWAP_ADMIN_ROLE");
    event PoolAlreadyExists(address tokenA, address tokenB);
    event InvalidOraclePrices(int priceA, int priceB);
    // 토큰 쌍에 대응하는 유동성 풀의 주소를 저장하는 매핑
    mapping(address => mapping(address => address)) private pools;

    IMultiDataConsumerV3 public priceOracle;

    address private bittoSwapPoolLogic;

    event PoolCreated(
        address indexed tokenA,
        address indexed tokenB,
        address pool
    );

    constructor(address _priceOracle, address _admin, address _poolLogic) {
        priceOracle = IMultiDataConsumerV3(_priceOracle);
        _setupRole(SWAP_ADMIN_ROLE, _admin);
        // Deploy the logic contract and keep its address.
        bittoSwapPoolLogic = _poolLogic;
    }

    // createPool 함수는 두 개의 토큰과 그들의 가격 피드 주소를 받아서 새로운 유동성 풀을 생성
    function createPool(
        address _tokenA,
        address _tokenB,
        address feedAddressA,
        address feedAddressB,
        address _swapStorage // Add this parameter
    ) external onlyRole(SWAP_ADMIN_ROLE) returns (address pool) {
        require(
            pools[address(_tokenA)][address(_tokenB)] == address(0),
            "Pool already exists"
        );

        priceOracle.setPriceFeed(_tokenA, feedAddressA);
        priceOracle.setPriceFeed(_tokenB, feedAddressB);
        //setPrice setting
        int latestTokenAPrice = priceOracle.getLatestPrice(_tokenA);
        int latestTokenBPrice = priceOracle.getLatestPrice(_tokenB);

        require(
            latestTokenAPrice > 0 && latestTokenBPrice > 0,
            "Invalid oracle prices"
        );

        uint ratio = uint(latestTokenAPrice) / uint(latestTokenBPrice);

        // Generate initialization data for the proxy contract
        bytes memory initData = abi.encodeWithSignature(
            "initialize(address,address,uint256,uint256,address)",
            _tokenA,
            _tokenB,
            ratio * 10000,
            10000,
            _swapStorage // The storage contract instance
        );

        BittoSwapPoolProxy poolProxy = new BittoSwapPoolProxy(
            bittoSwapPoolLogic, // Use the logic contract's address.
            msg.sender,
            initData
        );

        pool = address(poolProxy);

        pools[address(_tokenA)][address(_tokenB)] = pool;
        pools[address(_tokenB)][address(_tokenA)] = pool;

        emit PoolCreated(address(_tokenA), address(_tokenB), pool);

        return pool;
    }

    function setLogicContract(address newLogicContract) external onlyOwner {
        bittoSwapPoolLogic = newLogicContract;
    }
}
