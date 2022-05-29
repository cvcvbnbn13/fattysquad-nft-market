const instance = await NFTMarket.deployed();

instance.mintToken(
  'https://gateway.pinata.cloud/ipfs/QmdMCqPXkHFoJBEJMhGpGUW7Me6LF9BjhyQ8RoL4xTPzpk',
  '500000000000000000',
  { value: '20000000000000000', from: accounts[0] }
);
instance.mintToken(
  'https://gateway.pinata.cloud/ipfs/QmXwfv6MoUdr1rQpvveabvvDnBYp1PSdP1v6HzgrHrv8t1',
  '500000000000000000',
  { value: '20000000000000000', from: accounts[0] }
);
instance.mintToken(
  'https://gateway.pinata.cloud/ipfs/QmXNqfiwRmQCWZenjf6VqyW1b5cJ1EmR6k7jUduXMHjyH6',
  '500000000000000000',
  { value: '20000000000000000', from: accounts[0] }
);
