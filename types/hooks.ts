import { MetaMaskInpageProvider } from '@metamask/providers';
import { Contract, providers } from 'ethers';
import { SWRResponse } from 'swr';
import { NftMarketContract } from './nftMarketContract';

export type Web3Dependencies = {
  provider: providers.Web3Provider;
  contract: NftMarketContract;
  ethereum: MetaMaskInpageProvider;
  isLoading: boolean;
};

export type HooksFactory<D = any, R = any, P = any> = {
  (deps: Partial<Web3Dependencies>): (params?: P) => SWRResponse<D> & R;
};

// export type HandlerHook = (params: string) => SWRResponse;
