import useSWR from 'swr';
import { useCallback } from 'react';
import { HooksFactory } from '@_types/hooks';
import { NFT } from '@_types/nft';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';

type HooksUseListedNFTsResponse = {
  buyNFT: (token: number, value: number) => Promise<void>;
};

type ListedNFTsHookFactory = HooksFactory<NFT[], HooksUseListedNFTsResponse>;

export type UseListedNFTsHook = ReturnType<ListedNFTsHookFactory>;

// deos => provider, ethereum, contract
export const hookFactory: ListedNFTsHookFactory =
  ({ contract }) =>
  () => {
    const { data, ...swr } = useSWR(
      contract ? 'web3/useListedNFTsHooks' : null,
      async () => {
        const coreNFTs = await contract!.getAllNFTsForSale();
        const nfts = [] as NFT[];

        for (let i = 0; i < coreNFTs.length; i++) {
          const item = coreNFTs[i];
          const tokenURI = await contract!.tokenURI(item.tokenId);
          const metaResponse = await fetch(tokenURI);
          const metaData = await metaResponse.json();

          nfts.push({
            price: parseFloat(ethers.utils.formatEther(item.price)),
            tokenId: item.tokenId.toNumber(),
            creator: item.creator,
            isListed: item.isListed,
            metaData,
          });
        }
        return nfts;
      }
    );

    const _contract = contract;
    const buyNFT = useCallback(
      async (tokenId: number, value: number): Promise<void> => {
        try {
          const tx = await _contract!.buyNFT(tokenId, {
            value: ethers.utils.parseEther(value.toString()),
          });

          await toast.promise(tx!.wait(), {
            pending: '購買中...',
            success: '購買完成',
            error: '購買失敗',
          });

          window.location.reload();
        } catch (e: any) {
          console.error(e.message);
        }
      },
      [_contract]
    );

    return {
      ...swr,
      buyNFT,
      data: data || [],
    };
  };
