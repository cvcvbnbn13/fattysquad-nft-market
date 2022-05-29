/* eslint-disable @next/next/no-img-element */
import React, { FunctionComponent } from 'react';
import NFTItem from '../Item';
import { useListedNFTs } from '@hooks/web3';

const NFTList: FunctionComponent = () => {
  const { listedNFTs } = useListedNFTs();

  console.log(listedNFTs);

  return (
    <div className="mt-12 max-w-lg mx-auto grid gap-5 lg:grid-cols-3 lg:max-w-none">
      {listedNFTs.data?.map(nft => (
        <div
          key={nft.metaData.image}
          className="flex flex-col rounded-lg shadow-lg overflow-hidden"
        >
          <NFTItem item={nft} buyNFT={listedNFTs.buyNFT} />
        </div>
      ))}
    </div>
  );
};

export default NFTList;
