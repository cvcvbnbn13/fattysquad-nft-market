import { useCallback } from 'react';
import useSWR from 'swr';
import { HooksFactory } from '@_types/hooks';
import { NFT } from '@_types/nft';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';

type HooksUseOwnedNFTsResponse = {
  listNFT: (tokenId: number, price: number) => Promise<void>;
};

type OwnedNFTsHookFactory = HooksFactory<NFT[], HooksUseOwnedNFTsResponse>;

export type UseOwnedNFTsHook = ReturnType<OwnedNFTsHookFactory>;

// deos => provider, ethereum, contract
export const hookFactory: OwnedNFTsHookFactory =
  ({ contract }) =>
  () => {
    const { data, ...swr } = useSWR(
      contract ? 'web3/useOwnedNFTsHooks' : null,
      async () => {
        const nfts = [] as NFT[];
        const coreNFTs = await contract!.getOwnedNfts();

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
    const listNFT = useCallback(
      async (tokenId: number, price: number): Promise<void> => {
        try {
          const tx = await _contract!.placeNFTForSale(
            tokenId,
            ethers.utils.parseEther(price.toString()),
            {
              value: ethers.utils.parseEther((0.02).toString()),
            }
          );

          await toast.promise(tx!.wait(), {
            pending: '上架中...',
            success: '上架完成',
            error: '上架失敗',
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
      listNFT,
      data: data || [],
    };
  };
