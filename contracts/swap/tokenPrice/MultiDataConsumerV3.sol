// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

interface IMultiDataConsumerV3 {
    function getLatestPrice(address tokenAddress) external view returns (int);
}

contract MultiDataConsumerV3 is
    Initializable,
    IMultiDataConsumerV3,
    OwnableUpgradeable
{
    mapping(address => AggregatorV3Interface) private priceFeeds;

    function initialize() public initializer {
        __Ownable_init();
    }

    function setPriceFeed(
        address tokenAddress,
        address feedAddress
    ) public onlyOwner {
        priceFeeds[tokenAddress] = AggregatorV3Interface(feedAddress);
    }

    function getLatestPrice(
        address tokenAddress
    ) public view override returns (int) {
        (
            ,
            /* uint80 roundID */ int answer /*uint startedAt*/ /*uint timeStamp*/ /*uint80 answeredInRound*/,
            ,
            ,

        ) = priceFeeds[tokenAddress].latestRoundData();

        return answer;
    }
}
