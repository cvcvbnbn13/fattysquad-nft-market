import React, {
  createContext,
  FunctionComponent,
  useState,
  ReactElement,
  useContext,
  useEffect,
} from 'react';
import { MetaMaskInpageProvider } from '@metamask/providers';
import { ethers } from 'ethers';
import {
  Web3State,
  inititalState,
  loadContract,
  createWeb3State,
} from './utils';
import { NftMarketContract } from '@_types/nftMarketContract';

const Web3Context = createContext<Web3State>(inititalState);

type FcProps = {
  children: ReactElement;
};

const pageReload = (...x: unknown[]) => {
  window.location.reload();
};

const handleAccountChanged = (ethereum: MetaMaskInpageProvider) => async () => {
  const isLocked = !(await ethereum._metamask.isUnlocked());
  if (isLocked) {
    pageReload();
  }
};

const setGlobalListeners = (ethereum: MetaMaskInpageProvider) => {
  ethereum.on('chainChanged', () => {
    pageReload();
  });
  ethereum.on('accountsChanged', handleAccountChanged(ethereum));
};

const removeGlobalListeners = (ethereum: MetaMaskInpageProvider) => {
  ethereum?.removeListener('chainChanged', () => {
    pageReload();
  });
  ethereum?.removeListener('accountsChanged', handleAccountChanged);
};

// context provider
const Web3Provider: FunctionComponent<FcProps> = ({ children }) => {
  const [web3Api, setWeb3Api] = useState<Web3State>(inititalState);

  useEffect(() => {
    async function initWeb3() {
      try {
        // 連接以太網路
        const provider = new ethers.providers.Web3Provider(
          window.ethereum as any
        );
        const contract = await loadContract('NFTMarket', provider);

        // Signer: （在 ethers 之中）Signer 是一個類別，通常會使用一些方法直接地或間接地存取私鑰，可以被用於簽核資訊及交易，並授權給網絡來呈現不同需求。
        const signer = provider.getSigner();
        const signedContract = contract.connect(signer);

        setTimeout(() => setGlobalListeners(window.ethereum), 500);
        setWeb3Api(
          createWeb3State({
            ethereum: window.ethereum,
            provider,
            contract: signedContract as unknown as NftMarketContract,
            isLoading: false,
          })
        );
      } catch (error: any) {
        console.error(error.message);
        setWeb3Api(api => {
          return createWeb3State({ ...(api as any), isLoading: false });
        });
      }
    }

    initWeb3();
    return () => {
      removeGlobalListeners(window.ethereum);
    };
  }, []);

  return (
    <Web3Context.Provider value={web3Api}>{children}</Web3Context.Provider>
  );
};

export function useWeb3() {
  return useContext(Web3Context);
}

export default Web3Provider;
