// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../tokenPrice/MultiDataConsumerV3.sol";
import "./BittoSwapStorage.sol"; // BittoSwapV2Storage 스토리지 컨트랙트를 가져옴

interface IERC20 {
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    function balanceOf(address account) external view returns (uint256);

    function transfer(
        address recipient,
        uint256 amount
    ) external returns (bool);
}

contract bittoSwapV1 is
    Initializable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable,
    OwnableUpgradeable,
    AccessControlUpgradeable
{
    using SafeMathUpgradeable for uint;

    struct Pair {
        IERC20 token0;
        IERC20 token1;
        uint reserve0;
        uint reserve1;
        uint lastUpdateTime;
        uint priceCumulativeLast;
    }
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant SWAP_ADMIN_ROLE = keccak256("SWAP_ADMIN_ROLE");

    mapping(address => mapping(address => Pair)) public pairs;

    IMultiDataConsumerV3 public priceOracle;
    BittoSwapStorage public swapStorage; // BittoSwapV2Storage 스토리지 컨트랙트를 저장

    function initialize(
        address _priceOracle,
        address _swapStorage
    ) public initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        __AccessControl_init();

        // 역할(role) 설정
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(PAUSER_ROLE, _msgSender());
        _setupRole(SWAP_ADMIN_ROLE, _msgSender());

        // Pausable 역할(role) 설정
        _setRoleAdmin(PAUSER_ROLE, DEFAULT_ADMIN_ROLE);

        priceOracle = IMultiDataConsumerV3(_priceOracle);
        swapStorage = BittoSwapStorage(_swapStorage); // BittoSwapV2Storage 스토리지 컨트랙트 초기화
    }

    modifier onlySwapAdmin() {
        require(hasRole(SWAP_ADMIN_ROLE, _msgSender()), "Not a Swap Admin");
        _;
    }

    function addPair(
        address _token0,
        address _token1,
        address feedAddress0,
        address feedAddress1
    ) public onlyOwner {
        int latestToken0Price = priceOracle.getLatestPrice(feedAddress0);
        int latestToken1Price = priceOracle.getLatestPrice(feedAddress1);

        require(
            latestToken0Price > 0 && latestToken1Price > 0,
            "Invalid oracle prices"
        );

        uint ratio = uint(latestToken0Price).div(uint(latestToken1Price));

        pairs[_token0][_token1] = Pair({
            token0: IERC20(_token0),
            token1: IERC20(_token1),
            reserve0: ratio.mul(10000),
            reserve1: 10000,
            lastUpdateTime: block.timestamp,
            priceCumulativeLast: ratio
        });
    }

    function getReserves(
        address _token0,
        address _token1
    ) public view returns (uint reserve0, uint reserve1) {
        return (
            pairs[_token0][_token1].reserve0,
            pairs[_token0][_token1].reserve1
        );
    }

    function swap(uint amountIn, address _tokenIn, address _tokenOut) external {
        uint priceCumulativeLast = pairs[_tokenIn][_tokenOut]
            .priceCumulativeLast;
        uint amountInWithFee = amountIn.mul(997);
        require(
            priceCumulativeLast > amountInWithFee / 1000,
            "Price slippage too high"
        );

        require(
            pairs[_tokenIn][_tokenOut].token0.balanceOf(msg.sender) >= amountIn,
            "Insufficient balance"
        );

        require(
            pairs[_tokenIn][_tokenOut].token0.transferFrom(
                msg.sender,
                address(this),
                amountIn
            ),
            "Transfer failed"
        );

        uint amountOut = getAmountOut(
            amountIn,
            pairs[_tokenIn][_tokenOut].reserve0,
            pairs[_tokenIn][_tokenOut].reserve1
        );

        update(amountIn, _tokenIn, _tokenOut);

        bool transferBackSuccess = pairs[_tokenIn][_tokenOut].token1.transfer(
            msg.sender,
            amountOut
        );
        require(transferBackSuccess, "Transfer back to user failed");

        // 스왑 기록 추가
        swapStorage.addSwap(msg.sender, amountIn, amountOut, block.timestamp);
    }

    function update(uint amountIn, address tokenIn, address tokenOut) internal {
        uint amountOut = getAmountOut(
            amountIn,
            pairs[tokenIn][tokenOut].reserve0,
            pairs[tokenIn][tokenOut].reserve1
        );

        if (pairs[tokenIn][tokenOut].token0 == IERC20(tokenIn)) {
            pairs[tokenIn][tokenOut].reserve0 += amountIn;
            pairs[tokenIn][tokenOut].reserve1 -= amountOut;
        } else if (pairs[tokenIn][tokenOut].token1 == IERC20(tokenIn)) {
            pairs[tokenIn][tokenOut].reserve1 += amountIn;
            pairs[tokenIn][tokenOut].reserve0 -= amountOut;
        }
        pairs[tokenIn][tokenOut].lastUpdateTime = block.timestamp;
        pairs[tokenIn][tokenOut].priceCumulativeLast =
            pairs[tokenIn][tokenOut].reserve1 /
            pairs[tokenIn][tokenOut].reserve0;
    }

    function getAmountOut(
        uint amountIn,
        uint reserveIn,
        uint reserveOut
    ) internal pure returns (uint amountOut) {
        require(amountIn > 0, "INSUFFICIENT_INPUT_AMOUNT");
        require(
            reserveIn > 0 && reserveOut > 0,
            "UniswapV2: INSUFFICIENT_LIQUIDITY"
        );
        uint amountInWithFee = amountIn.mul(997);
        uint numerator = amountInWithFee.mul(reserveOut);
        uint denominator = reserveIn.mul(1000).add(amountInWithFee);
        amountOut = numerator.div(denominator);
    }

    // pause 및 unpause 함수를 역할(role)에 따라 호출할 수 있도록 변경
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }
}
