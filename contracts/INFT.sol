// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface INFT is IERC721 {
    function createToken(string memory _tokenURI, address _addressToMint)
        external
        returns (uint256);
}
