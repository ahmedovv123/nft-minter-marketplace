// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.3;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract NFT is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    address markeplaceAddress;

    constructor(address _marketplaceAddress) ERC721("UTNFT Tokens", "UTT") {
        markeplaceAddress = _marketplaceAddress;
    }

    modifier onlyMarketplace(address minterAddress) {
        require(
            minterAddress == markeplaceAddress,
            "Only markeplace of this NFT can mint"
        );
        _;
    }

    function createToken(string memory _tokenURI, address _addressToMint)
        public
        onlyMarketplace(msg.sender)
        returns (uint256)
    {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _mint(_addressToMint, newItemId);
        _setTokenURI(newItemId, _tokenURI);
        return newItemId;
    }
}
