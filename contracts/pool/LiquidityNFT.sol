// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract LiquidityNFT is ERC721 {
    uint public nextTokenId;
    uint public totalSupply;

    mapping(uint => uint) private _liquidity;
    mapping(uint => uint) public mintingBlockNumber;

    constructor() ERC721("Liquidity NFT", "LNFT") {}

    function mint(address to, uint liquidity) external returns (uint tokenId) {
        tokenId = nextTokenId;

        _mint(to, tokenId);

        _liquidity[tokenId] = liquidity;

        // Store the block number when the token was minted
        mintingBlockNumber[tokenId] = block.number;

        totalSupply += liquidity;

        nextTokenId++;

        return tokenId;
    }

    function getLiquidity(uint tokenId) external view returns (uint) {
        return _liquidity[tokenId];
    }

    function burn(uint tokenId) external {
        require(
            _isApprovedOrOwner(_msgSender(), tokenId),
            "Caller is not owner nor approved"
        );

        totalSupply -= _liquidity[tokenId];

        _burn(tokenId);

        delete _liquidity[tokenId];

        // Delete the stored block number
        delete mintingBlockNumber[tokenId];
    }
}
