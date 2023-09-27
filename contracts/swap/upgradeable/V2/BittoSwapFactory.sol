// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "../../tokenPrice/MultiDataConsumerV3.sol";
import "./BittoSwapPoolProxy.sol";
import "./BittoSwapPool.sol";

contract BittoSwapFactory is Ownable, AccessControl {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant SWAP_ADMIN_ROLE = keccak256("SWAP_ADMIN_ROLE");

    mapping(address => mapping(address => address)) private pools;

    IMultiDataConsumerV3 public priceOracle;
    address private bittoSwapPoolLogic;
    IERC20 public rewardToken;
    LiquidityNFT public liquidityNFT;

    event PoolCreated(
        address indexed tokenA,
        address indexed tokenB,
        address pool
    );

    constructor(
        address _priceOracle,
        address _admin,
        address _poolLogic,
        address _rewardToken,
        address _liquidityNFT
    ) {
        require(_priceOracle != address(0), "Invalid price oracle");
        require(_admin != address(0), "Invalid admin");
        require(_poolLogic != address(0), "Invalid pool logic");
        require(_rewardToken != address(0), "Invalid reward token address");
        require(_liquidityNFT != address(0), "Invalid liquidity NFT address");

        priceOracle = IMultiDataConsumerV3(_priceOracle);
        _setupRole(SWAP_ADMIN_ROLE, _admin);

        bittoSwapPoolLogic = _poolLogic;
        rewardToken = IERC20(_rewardToken);
        liquidityNFT = LiquidityNFT(_liquidityNFT);
    }

    function createPool(
        address _tokenA,
        address _tokenB,
        address feedAddressA,
        address feedAddressB
    ) external onlyRole(SWAP_ADMIN_ROLE) returns (address pool) {
        require(pools[_tokenA][_tokenB] == address(0), "Pool already exists");

        require(
            feedAddressA != address(0) && feedAddressB != address(0),
            "Feed addresses are not valid"
        );
        require(_tokenA != _tokenB, "Tokens A and B should not be the same.");

        priceOracle.setPriceFeed(_tokenA, feedAddressA);
        priceOracle.setPriceFeed(_tokenB, feedAddressB);

        // Generate initialization data for the proxy contract.
        bytes memory initData = abi.encodeWithSignature(
            "initialize(address,address,address,address,address)",
            _tokenA,
            _tokenB,
            address(liquidityNFT),
            address(rewardToken),
            address(priceOracle)
        );

        BittoSwapPoolProxy poolProxy = new BittoSwapPoolProxy(
            bittoSwapPoolLogic,
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
        require(
            newLogicContract != address(0),
            "New logic contract is invalid."
        );

        bittoSwapPoolLogic = newLogicContract;
    }
}
