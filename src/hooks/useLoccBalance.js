import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { utils } from 'ethers';
import { LOCC_TOKEN } from 'src/constants';
import { SET_LOCC_BALANCE } from 'src/store';
import { ChainId } from '@uniswap/sdk';
import { useActiveWeb3React } from './index';
import { useTokenContract } from './useContract';

export function useLoccBalance() {
  const { account, chainId } = useActiveWeb3React();

  const dispatch = useDispatch();

  const loccBalance = useSelector(state => state.app.loccBalance);

  const loccTokenContract = useTokenContract(chainId ? LOCC_TOKEN[chainId] : LOCC_TOKEN[ChainId.MAINNET]);

  const refreshBalance = useCallback(async () => {
    if (account && loccTokenContract) {
      const balanceOf = await loccTokenContract.balanceOf(account);
      if (!balanceOf) return;

      const balance = parseFloat(utils.formatUnits(balanceOf, 18));
      dispatch({ type: SET_LOCC_BALANCE, balance });
    } else {
      dispatch({ type: SET_LOCC_BALANCE, balance: 0 });
    }
  });

  useEffect(() => {
    refreshBalance();
  }, [account, chainId]);

  return { loccBalance, refreshBalance };
}
