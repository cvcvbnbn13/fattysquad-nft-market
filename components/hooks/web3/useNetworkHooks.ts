import useSWR from 'swr';
import { HooksFactory } from '@_types/hooks';

const NETWORKS: { [k: string]: string } = {
  1: '以太坊 主網路',
  3: 'Ropsten Test Network',
  4: 'Rinkeby Test Network',
  5: 'Goerli Test Network',
  42: 'Kovan Test Network',
  56: 'Binance Smart Chain',
  1337: 'Ganache',
};

const targetChainId = process.env.NEXT_PUBLIC_TARGET_CHAIN_ID as string;
const targetNetwork = NETWORKS[targetChainId];

type HooksUseNetworkResponse = {
  isLoading: boolean;
  isSupported: boolean;
  targetNetwork: string;
  isConnectedToNetwork: boolean;
};

type NetworkHookFactory = HooksFactory<string, HooksUseNetworkResponse>;

export type UseNetworkHook = ReturnType<NetworkHookFactory>;

// deos => provider, ethereum, contract
export const hookFactory: NetworkHookFactory =
  ({ provider, isLoading }) =>
  () => {
    const { data, isValidating, ...swr } = useSWR(
      provider ? 'web3/useNetworkHooks' : null,
      async () => {
        const chainId = (await provider!.getNetwork()).chainId;

        if (!chainId) {
          throw '接收不到網路，請嘗試重新載入你的瀏覽器或是連接另一個網路';
        }

        return NETWORKS[chainId];
      },
      {
        revalidateOnFocus: false,
      }
    );

    const isSupported = data === targetNetwork;

    return {
      ...swr,
      data,
      isValidating,
      targetNetwork,
      isSupported,
      isLoading: isLoading as boolean,
      isConnectedToNetwork: !isLoading && isSupported,
    };
  };
