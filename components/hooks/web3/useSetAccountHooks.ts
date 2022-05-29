import useSWR from 'swr';
import { HooksFactory } from '@_types/hooks';
import { useEffect } from 'react';

type HooksUseAccountResponse = {
  connect: () => void;
  isLoading: boolean;
  isInstalled: boolean;
};

type AccountHookFactory = HooksFactory<string, HooksUseAccountResponse>;

export type UseAccountHook = ReturnType<AccountHookFactory>;

// deos => provider, ethereum, contract
export const hookFactory: AccountHookFactory =
  ({ provider, ethereum, isLoading }) =>
  () => {
    const { data, mutate, isValidating, ...swr } = useSWR(
      provider ? 'web3/useAccountHooks' : null,
      async () => {
        const accounts = await provider!.listAccounts();

        const firstAccount = accounts[0];

        if (!firstAccount) {
          throw '找不到錢包帳戶，請確認帳戶已連結';
        }

        return firstAccount;
      },
      {
        revalidateOnFocus: false,
        shouldRetryOnError: false,
      }
    );

    useEffect(() => {
      ethereum?.on('accountsChanged', handleAccountsChanged);
      return () => {
        ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      };
    });

    const handleAccountsChanged = (...arg: unknown[]) => {
      const accounts = arg[0] as string[];
      if (accounts.length === 0) {
        console.error('請確認帳戶已連結');
      } else if (accounts[0] !== data) {
        // 使用mutate來提供新數據
        mutate(accounts[0]);
      }
    };

    const connect = async () => {
      try {
        ethereum?.request({ method: 'eth_requestAccounts' });
      } catch (e) {
        console.error(e);
      }
    };

    return {
      ...swr,
      data,
      connect,
      mutate,
      isValidating,
      isLoading: isLoading as boolean,
      isInstalled: ethereum?.isMetaMask || false,
    };
  };
