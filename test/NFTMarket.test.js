const NFTMarket = artifacts.require('NFTMarket');
const { ethers } = require('ethers');
// 要測試的契約名字

contract('NFTMarket', accounts => {
  let _contract = null;
  let _nftPrice = ethers.utils.parseEther('0.05').toString();
  let _listingPrice = ethers.utils.parseEther('0.02').toString();

  before(async () => {
    _contract = await NFTMarket.deployed();
    console.log(accounts);
  });

  describe('Mint token', () => {
    const tokenURI = 'https://test.com';
    before(async () => {
      await _contract.mintToken(tokenURI, _nftPrice, {
        from: accounts[0],
        value: _listingPrice,
      });
    });

    it('owner of the first token should be address[0]', async () => {
      // ownwerOf(tokenId)
      const owner = await _contract.ownerOf(1);
      assert.equal(owner, accounts[0], 'owner did not get');
    });

    it('first token should point to the correct tokenURI', async () => {
      const actualTokenURI = await _contract.tokenURI(1);
      assert.equal(actualTokenURI, tokenURI, 'tokenURI is not correctly set');
    });

    it('should not be possible to create a NFT with used tokenURI', async () => {
      try {
        await _contract.mintToken(tokenURI, { from: accounts[0] });
      } catch (error) {
        assert(error, 'NFT was minted with previously used tokenURI');
      }
    });

    it('should have one listed item', async () => {
      const listedItem = await _contract.listedItemsCount();
      assert.equal(listedItem.toNumber(), 1, 'Listed items is not 1');
    });

    it('should have create NFT item', async () => {
      const nftItem = await _contract.getNFTItem(1);
      console.log(nftItem);

      assert.equal(nftItem.tokenId, 1, 'Listed item count is not 1');
      assert.equal(nftItem.price, _nftPrice, 'Listed item count is not 1');
      assert.equal(nftItem.creator, accounts[0], 'Listed item count is not 1');
      assert.equal(nftItem.isListed, true, 'Listed item count is not 1');
    });
  });

  describe('Buy NFT', () => {
    before(async () => {
      await _contract.buyNFT(1, {
        from: accounts[1],
        value: _nftPrice,
      });
    });

    it('should unlist the item', async () => {
      const listedItem = await _contract.getNFTItem(1);
      assert.equal(listedItem.isListed, false, 'Item is still Listed');
    });

    it('should decrease listed items count', async () => {
      const listedItemsCount = await _contract.listedItemsCount();
      assert.equal(
        listedItemsCount.toNumber(),
        0,
        'Count has not been decrease'
      );
    });

    it('should change the owner', async () => {
      const currentOwner = await _contract.ownerOf(1);
      assert.equal(currentOwner, accounts[1], 'owner did not change');
    });
  });

  describe('Token Transfers', () => {
    const tokenURI = 'https://test-json-2.com';
    before(async () => {
      await _contract.mintToken(tokenURI, _nftPrice, {
        from: accounts[0],
        value: _listingPrice,
      });
    });

    it('should have two NFTs Created', async () => {
      const totalSupply = await _contract.totalSupply();
      assert.equal(
        totalSupply.toNumber(),
        2,
        'Total supply of token is not correct'
      );
    });

    it('should be able retreive NFT by index', async () => {
      const nft1 = await _contract.tokenByIndex(0);
      const nft2 = await _contract.tokenByIndex(1);
      assert.equal(nft1.toNumber(), 1, 'NFT id is wrong');
      assert.equal(nft2.toNumber(), 2, 'NFT id is wrong');
    });

    it('should have one listed NFT', async () => {
      const allNFTs = await _contract.getAllNFTsForSale();

      console.log(allNFTs);

      assert.equal(allNFTs[0].tokenId, 2, 'NFT has a wrong id');
    });

    it('account[1] should have one owned NFT', async () => {
      const ownedNFTs = await _contract.getOwnedNfts({ from: accounts[1] });

      assert.equal(ownedNFTs[0].tokenId, 1, 'NFT has a wrong id');
    });

    it('accounts[0] should have one owned NFT', async () => {
      const ownedNFTs = await _contract.getOwnedNfts({ from: accounts[0] });

      assert.equal(ownedNFTs[0].tokenId, 2, 'NFT has a wrong id');
    });
  });

  describe('Token transfer to new owner', () => {
    before(async () => {
      await _contract.transferFrom(accounts[0], accounts[1], 2);
    });

    it('accounts[0] should own 0 tokens', async () => {
      const ownedNFTs = await _contract.getOwnedNfts({ from: accounts[0] });
      assert.equal(ownedNFTs.length, 0, 'Wrong length of tokens');
    });
    it('accounts[1] should own 2 tokens', async () => {
      const ownedNFTs = await _contract.getOwnedNfts({ from: accounts[1] });
      assert.equal(ownedNFTs.length, 2, 'Wrong length of tokens');
    });
  });

  describe('List a NFT', () => {
    before(async () => {
      await _contract.placeNFTForSale(1, _nftPrice, {
        from: accounts[1],
        value: _listingPrice,
      });
    });

    it('should have two listed items', async () => {
      const listedItem = await _contract.getAllNFTsForSale();

      assert.equal(listedItem.length, 2, 'Invalid length of nfts');
    });

    it('should have two listed price', async () => {
      await _contract.setListingPrice(_listingPrice, { from: accounts[0] });

      const listingPr = await _contract.listingPrice();

      console.log(listingPr.toString());
      assert.equal(
        listingPr.toString(),
        _listingPrice,
        'Invalid length of nfts'
      );
    });
  });
});
