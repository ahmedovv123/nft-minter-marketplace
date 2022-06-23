// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./INFT.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Errors

error PriceNotMet(address nftAddress, uint256 tokenId, uint256 price);
error FeePriceNotMet(uint256 price);
error MintPriceNotMet(uint256 price);
error ItemNotForSale(address nftAddress, uint256 tokenId);
error NotListed(address nftAddress, uint256 tokenId);
error AlreadyListed(address nftAddress, uint256 tokenId);
error NoProceeds();
error NotOwner();
error NotApprovedForMarketplace();
error PriceMustBeAboveZero();

contract NftMarketplace is ReentrancyGuard, ERC20, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private mintedTokens;

    address public nativeNftAddress;
    uint256 public initialMintCost;
    uint256 public listingFee;
    mapping(address => mapping(uint256 => Listing)) private s_listings;
    mapping(address => uint256) private s_proceeds;

    // Constructor

    constructor(
        uint256 _initialMintCost,
        uint256 _initialSupply,
        uint256 _listingFee,
        string memory _tokenName,
        string memory _tokenSymbol
    ) ERC20(_tokenName, _tokenSymbol) {
        _mint(msg.sender, _initialSupply);
        initialMintCost = _initialMintCost;
        listingFee = _listingFee;
    }

    // Structs

    struct Listing {
        uint256 price;
        address seller;
    }

    // Events

    event ItemListed(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemCanceled(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId
    );

    event ItemBought(
        address indexed buyer,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    // Modifiers

    modifier notListed(
        address nftAddress,
        uint256 tokenId,
        address owner
    ) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price > 0) {
            revert AlreadyListed(nftAddress, tokenId);
        }
        _;
    }

    modifier isOwner(
        address nftAddress,
        uint256 tokenId,
        address spender
    ) {
        INFT nft = INFT(nftAddress);
        address owner = nft.ownerOf(tokenId);
        if (spender != owner) {
            revert NotOwner();
        }
        _;
    }

    modifier isListed(address nftAddress, uint256 tokenId) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price <= 0) {
            revert NotListed(nftAddress, tokenId);
        }
        _;
    }

    // Functions

    function listItem(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    )
        external
        payable
        notListed(nftAddress, tokenId, msg.sender)
        isOwner(nftAddress, tokenId, msg.sender)
    {
        if (nftAddress == nativeNftAddress) {
            require(
                msg.value == 0,
                "You should not pay fee when listing native NFT"
            );
        } else {
            if (msg.value < listingFee) {
                revert FeePriceNotMet(listingFee);
            }
        }

        if (price <= 0) {
            revert PriceMustBeAboveZero();
        }

        INFT nft = INFT(nftAddress);

        if (nft.getApproved(tokenId) == address(this) || nft.isApprovedForAll(msg.sender, address(this)) == true) {
            s_listings[nftAddress][tokenId] = Listing(price, msg.sender);
            emit ItemListed(msg.sender, nftAddress, tokenId, price);
        } else {
            revert NotApprovedForMarketplace();
        }
    }

    function cancelListing(address nftAddress, uint256 tokenId)
        external
        isOwner(nftAddress, tokenId, msg.sender)
        isListed(nftAddress, tokenId)
    {
        delete (s_listings[nftAddress][tokenId]);
        emit ItemCanceled(msg.sender, nftAddress, tokenId);
    }

    function buyItem(address nftAddress, uint256 tokenId)
        external
        payable
        isListed(nftAddress, tokenId)
        nonReentrant
    {
        Listing memory listedItem = s_listings[nftAddress][tokenId];

        if (msg.value < listedItem.price) {
            revert PriceNotMet(nftAddress, tokenId, listedItem.price);
        }

        s_proceeds[listedItem.seller] += msg.value;
        delete (s_listings[nftAddress][tokenId]);
        INFT(nftAddress).safeTransferFrom(
            listedItem.seller,
            msg.sender,
            tokenId
        );
        emit ItemBought(msg.sender, nftAddress, tokenId, listedItem.price);
    }

    function updateListing(
        address nftAddress,
        uint256 tokenId,
        uint256 newPrice
    )
        external
        isListed(nftAddress, tokenId)
        nonReentrant
        isOwner(nftAddress, tokenId, msg.sender)
    {
        if (newPrice == 0) {
            revert PriceMustBeAboveZero();
        }

        s_listings[nftAddress][tokenId].price = newPrice;
        emit ItemListed(msg.sender, nftAddress, tokenId, newPrice);
    }

    function mintNft(string memory _tokenURI, uint256 sentTokens) public {
        uint256 currentMintPrice = getCurrentMintPrice();
        if (sentTokens < currentMintPrice) {
            revert MintPriceNotMet(currentMintPrice);
        }
        IERC20(address(this)).transferFrom(
            msg.sender,
            address(this),
            sentTokens
        );
        INFT(nativeNftAddress).createToken(_tokenURI, msg.sender);
        mintedTokens.increment();
    }

    function withdrawProceeds() external {
        uint256 proceeds = s_proceeds[msg.sender];

        if (proceeds <= 0) {
            revert NoProceeds();
        }

        s_proceeds[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: proceeds}("");
        require(success, "Transfer failed");
    }

    function setNftAddress(address _nftAddress) public onlyOwner {
        nativeNftAddress = _nftAddress;
    }

    function setListingFee(uint256 _listingFee) public onlyOwner {
        listingFee = _listingFee;
    }

    function getListing(address nftAddress, uint256 tokenId)
        external
        view
        returns (Listing memory)
    {
        return s_listings[nftAddress][tokenId];
    }

    function getProceeds(address seller) external view returns (uint256) {
        return s_proceeds[seller];
    }

    function getCurrentMintPrice() public view returns (uint256) {
        uint256 mintedNftsCount = mintedTokens.current();
        uint256 extraAddition = initialMintCost / 100;

        return initialMintCost + extraAddition * mintedNftsCount;
    }

    function getListingFee() public view returns (uint256) {
        return listingFee;
    }
}
