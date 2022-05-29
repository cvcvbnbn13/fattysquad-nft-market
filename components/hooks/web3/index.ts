import { useWeb3 } from '@provider/web3';

const useAccount = () => {
  const { hooks } = useWeb3();

  const swrResponse = hooks.useAccount();

  return {
    account: swrResponse,
  };
};

const useNetwork = () => {
  const { hooks } = useWeb3();

  const swrResponse = hooks.useNetwork();

  return {
    network: swrResponse,
  };
};

const useListedNFTs = () => {
  const { hooks } = useWeb3();
  const swrResponse = hooks.useListedNFTs();

  return {
    listedNFTs: swrResponse,
  };
};

const useOwnedNFTs = () => {
  const { hooks } = useWeb3();
  const swrResponse = hooks.useOwnedNFTs();

  return {
    ownedNFTs: swrResponse,
  };
};

export { useAccount, useNetwork, useListedNFTs, useOwnedNFTs };
