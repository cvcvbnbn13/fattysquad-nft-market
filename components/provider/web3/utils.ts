import { MetaMaskInpageProvider } from '@metamask/providers';
import { Web3Hooks, setupHooks } from '@hooks/web3/useSetupHooks';
import { Contract, ethers, providers } from 'ethers';
import { Web3Dependencies } from '@_types/hooks';

declare global {
  interface Window {
    ethereum: MetaMaskInpageProvider;
  }
}

type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

export type Web3State = {
  isLoading: boolean;
  hooks: Web3Hooks;
} & Nullable<Web3Dependencies>;

export const inititalState = {
  ethereum: null,
  provider: null,
  contract: null,
  isLoading: true,
  hooks: setupHooks({ isLoading: true } as any),
};

export const createWeb3State = ({
  ethereum,
  provider,
  contract,
  isLoading,
}: Web3Dependencies) => {
  return {
    ethereum,
    provider,
    contract,
    isLoading,
    hooks: setupHooks({ ethereum, provider, contract, isLoading }),
  };
};

const NETWORK_ID = process.env.NEXT_PUBLIC_NETWORK_ID;

export const loadContract = async (
  name: string,
  provider: providers.Web3Provider
): Promise<Contract> => {
  if (!NETWORK_ID) {
    return Promise.reject('Network ID is not defined!');
  }

  const res = await fetch(`/contracts/${name}.json`);
  const contractData = await res.json();

  if (contractData.networks[NETWORK_ID].address) {
    // new ethers.Contract( address , abi , signerOrProvider )
    // 這是用來連接已經被部署的合約
    const contract = new ethers.Contract(
      contractData.networks[NETWORK_ID].address,
      contractData.abi,
      provider
    );

    return contract;
  } else {
    return Promise.reject(`Contract ${name} can't be loaded`);
  }
};
