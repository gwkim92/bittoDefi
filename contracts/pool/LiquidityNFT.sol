// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract LiquidityNFT is ERC721 {
    uint public nextTokenId;
    uint public totalSupply;

    mapping(uint => uint) private _tokenAliquidity;
    mapping(uint => uint) private _tokenBliquidity;
    mapping(uint => uint) private _totalLquidity;
    mapping(uint => uint) public mintingBlockNumber;

    constructor() ERC721("Liquidity NFT", "LNFT") {}

    function mint(
        address to,
        uint amountA,
        uint amountB
    ) external returns (uint tokenId) {
        tokenId = nextTokenId;

        _mint(to, tokenId);

        _tokenAliquidity[tokenId] = amountA;
        _tokenBliquidity[tokenId] = amountB;
        totalSupply += (amountA + amountB);
        _totalLquidity[tokenId] = totalSupply;
        // Store the block number when the token was minted
        mintingBlockNumber[tokenId] = block.number;
        nextTokenId++;

        return tokenId;
    }

    function getLiqudityAmounts(
        uint tokenId
    ) external view returns (uint, uint) {
        return (_tokenAliquidity[tokenId], _tokenBliquidity[tokenId]);
    }

    function getTotalLiqudityAmounts(
        uint tokenId
    ) external view returns (uint) {
        return (_totalLquidity[tokenId]);
    }

    function burn(uint tokenId) external {
        require(
            _isApprovedOrOwner(_msgSender(), tokenId),
            "Caller is not owner nor approved"
        );

        // Subtract the liquidity of token A and B from the total supply
        totalSupply -= (_tokenAliquidity[tokenId] + _tokenBliquidity[tokenId]);

        // Delete liquidity information of the token
        delete _tokenAliquidity[tokenId];
        delete _tokenBliquidity[tokenId];

        // Delete the stored block number
        delete mintingBlockNumber[tokenId];

        // Burn the token
        _burn(tokenId);
    }
}
