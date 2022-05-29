import { Web3Dependencies } from '@_types/hooks';
import {
  hookFactory as createAccount,
  UseAccountHook,
} from './useSetAccountHooks';

import {
  hookFactory as createNetwork,
  UseNetworkHook,
} from './useNetworkHooks';

import {
  hookFactory as createListedNFTs,
  UseListedNFTsHook,
} from './useListedNFTsHooks';

import {
  hookFactory as createOwnedNFTs,
  UseOwnedNFTsHook,
} from './useOwnedNFTsHooks';

export type Web3Hooks = {
  useAccount: UseAccountHook;
  useNetwork: UseNetworkHook;
  useListedNFTs: UseListedNFTsHook;
  useOwnedNFTs: UseOwnedNFTsHook;
};

export type SetupHooks = {
  (d: Web3Dependencies): Web3Hooks;
};

export const setupHooks: SetupHooks = d => {
  return {
    useAccount: createAccount(d),
    useNetwork: createNetwork(d),
    useListedNFTs: createListedNFTs(d),
    useOwnedNFTs: createOwnedNFTs(d),
  };
};
