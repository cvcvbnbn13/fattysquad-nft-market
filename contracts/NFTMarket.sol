// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract NFTMarket is ERC721URIStorage, Ownable {
  using Counters for Counters.Counter;

  Counters.Counter private _listedItems;
  Counters.Counter private _tokenIds;

  struct NFTItem {
    uint256 tokenId;
    uint256 price;
    address creator;
    bool isListed;
  }

  uint256[] private _allNFTs;
  mapping(uint256 => uint256) private _idToNFTIndex;

  uint256 public listingPrice = 0.02 ether;

  mapping(string => bool) private _existsTokenURIs;
  mapping(uint256 => NFTItem) private _idToNFTItem;

  mapping(address => mapping(uint256 => uint256)) private _ownedTokens;
  mapping(uint256 => uint256) private _idToOwnedIndex;

  event NFTItemCreated(
    uint256 tokenId,
    uint256 price,
    address creator,
    bool isListed
  );

  constructor() ERC721('FattyCreaturesNFT', 'FCNFT') {}

  // functions

  function tokenURIExists(string memory tokenURI) public view returns (bool) {
    return _existsTokenURIs[tokenURI] == true;
  }

  function setListingPrice(uint256 newPrice) external onlyOwner {
    require(newPrice > 0, 'Price must be at least 1 wei');
    listingPrice = newPrice;
  }

  function mintToken(string memory tokenURI, uint256 price)
    public
    payable
    returns (uint256)
  {
    require(!tokenURIExists(tokenURI), 'the tokenURI already exists');
    require(msg.value == listingPrice, 'Price must be equal to listing price');

    _tokenIds.increment();
    _listedItems.increment();

    uint256 newTokenId = _tokenIds.current();

    _safeMint(msg.sender, newTokenId);

    // function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal virtual {
    //     require(_exists(tokenId), "ERC721URIStorage: URI set of nonexistent token");
    //     _tokenURIs[tokenId] = _tokenURI;
    // }

    _setTokenURI(newTokenId, tokenURI);
    _createNFTItem(newTokenId, price);
    _existsTokenURIs[tokenURI] = true;

    return newTokenId;
  }

  function _createNFTItem(uint256 tokenId, uint256 price) private {
    require(price > 0, 'Price must be at least 1 wei');

    _idToNFTItem[tokenId] = NFTItem(tokenId, price, msg.sender, true);

    emit NFTItemCreated(tokenId, price, msg.sender, true);
  }

  function totalSupply() public view returns (uint256) {
    return _allNFTs.length;
  }

  function tokenByIndex(uint256 index) public view returns (uint256) {
    require(index < totalSupply(), 'Index out of bounds');
    return _allNFTs[index];
  }

  function tokenOfOwnerByIndex(address owner, uint256 index)
    public
    view
    returns (uint256)
  {
    require(index < ERC721.balanceOf(owner), 'Index out of bounds');
    return _ownedTokens[owner][index];
  }

  function getAllNFTsForSale() public view returns (NFTItem[] memory) {
    uint256 allItemsCounts = totalSupply();
    uint256 currentIndex = 0;
    NFTItem[] memory items = new NFTItem[](_listedItems.current());

    for (uint256 i = 0; i < allItemsCounts; i++) {
      uint256 tokenId = tokenByIndex(i);
      NFTItem storage item = _idToNFTItem[tokenId];

      if (item.isListed == true) {
        items[currentIndex] = item;
        currentIndex += 1;
      }
    }

    return items;
  }

  function listedItemsCount() public view returns (uint256) {
    return _listedItems.current();
  }

  function getNFTItem(uint256 tokenId) public view returns (NFTItem memory) {
    return _idToNFTItem[tokenId];
  }

  function buyNFT(uint256 tokenId) public payable {
    uint256 itemPrice = _idToNFTItem[tokenId].price;
    address owner = ERC721.ownerOf(tokenId);

    require(msg.sender != owner, 'You already have the NFT');
    require(msg.value == itemPrice, 'Please submit the asking price');

    _idToNFTItem[tokenId].isListed = false;
    _listedItems.decrement();

    _transfer(owner, msg.sender, tokenId);
    // 向原有主付款
    payable(owner).transfer(msg.value);
  }

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenId
  ) internal virtual override {
    super._beforeTokenTransfer(from, to, tokenId);

    if (from == address(0)) {
      _tokenToAllTokenEnumeration(tokenId);
    } else if (from != to) {
      _removeTokenFromOwner(from, tokenId);
    }

    if (to == address(0)) {
      _removeAllTokens(tokenId);
    } else if (to != from) {
      _tokenToOwnerEnumeration(to, tokenId);
    }
  }

  function _tokenToAllTokenEnumeration(uint256 tokenId) private {
    _idToNFTIndex[tokenId] = _allNFTs.length;
    _allNFTs.push(tokenId);
  }

  function _tokenToOwnerEnumeration(address to, uint256 tokenId) private {
    // how many token you have
    uint256 length = ERC721.balanceOf(to);

    _ownedTokens[to][length] = tokenId;
    _idToOwnedIndex[tokenId] = length;
  }

  function getOwnedNfts() public view returns (NFTItem[] memory) {
    uint256 ownedItemsCount = ERC721.balanceOf(msg.sender);
    NFTItem[] memory items = new NFTItem[](ownedItemsCount);

    for (uint256 i = 0; i < ownedItemsCount; i++) {
      uint256 tokenId = tokenOfOwnerByIndex(msg.sender, i);
      NFTItem storage item = _idToNFTItem[tokenId];
      items[i] = item;
    }

    return items;
  }

  function _removeTokenFromOwner(address from, uint256 tokenId) private {
    uint256 lastTokenIndex = ERC721.balanceOf(from) - 1;
    uint256 tokenIndex = _idToOwnedIndex[tokenId];

    if (tokenIndex != lastTokenIndex) {
      uint256 lastTokenId = _ownedTokens[from][lastTokenIndex];

      _ownedTokens[from][tokenIndex] = lastTokenId;

      _idToOwnedIndex[lastTokenId] = tokenIndex;
    }

    delete _idToOwnedIndex[tokenId];
    delete _ownedTokens[from][lastTokenIndex];
  }

  function _removeAllTokens(uint256 tokenId) private {
    // expamle: tokenId =2
    // allNFTs: [1,2,3]
    // _idToNFTIndex: [1=>0, 2=>1, 3=>2]

    //2
    uint256 lastTokenIndex = _allNFTs.length - 1;

    // 1
    uint256 tokenIndex = _idToNFTIndex[tokenId];

    // 3
    uint256 lastTokenId = _allNFTs[lastTokenIndex];

    // 1=>3
    _allNFTs[tokenIndex] = lastTokenId;

    // 3=>1
    _idToNFTIndex[lastTokenId] = tokenIndex;

    // 2=>1 byebye
    delete _idToNFTIndex[tokenId];

    // [1,3]
    _allNFTs.pop();
  }

  function burnToken(uint256 tokenId) public {
    _burn(tokenId);
  }

  //重新上架
  function placeNFTForSale(uint256 tokenId, uint256 newPrice) public payable {
    require(
      ERC721.ownerOf(tokenId) == msg.sender,
      'You are not owner of this nft'
    );
    require(
      _idToNFTItem[tokenId].isListed == false,
      'Item is already for sale'
    );
    require(msg.value == listingPrice, 'Price must be equal to listing price');

    _idToNFTItem[tokenId].isListed = true;
    _idToNFTItem[tokenId].price = newPrice;
    _listedItems.increment();
  }
}
