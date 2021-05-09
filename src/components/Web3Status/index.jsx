import React from 'react';
import styled from 'styled-components';

import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core';
import { useDispatch, useSelector } from 'react-redux';
import { OPEN_MODAL, CLOSE_MODAL } from 'src/store';

import WalletConnectIcon from 'src/assets/images/providers/walletConnectIcon.svg';
import CoinbaseWalletIcon from 'src/assets/images/providers/coinbaseWalletIcon.svg';
import FortmaticIcon from 'src/assets/images/providers/fortmaticIcon.png';
import PortisIcon from 'src/assets/images/providers/portisIcon.png';

import { fortmatic, injected, portis, walletconnect, walletlink } from 'src/connectors';
import { NetworkContextName } from 'src/constants';

import { shortenAddress } from 'src/utils';

import Identicon from '../Identicon';

const IconWrapper = styled.div`
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;
  margin-left: 6px;
  & > * {
    height: ${({ size }) => (size ? size + 'px' : '32px')};
    width: ${({ size }) => (size ? size + 'px' : '32px')};
  }
`;

// eslint-disable-next-line react/prop-types
function StatusIcon({ connector }) {
  if (connector === injected) {
    return <Identicon />;
  }
  if (connector === walletconnect) {
    return (
      <IconWrapper size={16}>
        <img src={WalletConnectIcon} />
      </IconWrapper>
    );
  }
  if (connector === walletlink) {
    return (
      <IconWrapper size={16}>
        <img src={CoinbaseWalletIcon} />
      </IconWrapper>
    );
  }
  if (connector === fortmatic) {
    return (
      <IconWrapper size={16}>
        <img src={FortmaticIcon} />
      </IconWrapper>
    );
  }
  if (connector === portis) {
    return (
      <IconWrapper size={16}>
        <img src={PortisIcon} />
      </IconWrapper>
    );
  }
  return null;
}

function Web3StatusInner() {
  const dispatch = useDispatch();

  const { account, connector, error } = useWeb3React();

  const walletModalOpen = useSelector(state => state.modals.walletManager.show);

  const toggleWalletModal = () => {
    if (walletModalOpen) dispatch({ type: CLOSE_MODAL, name: 'walletManager' });
    else dispatch({ type: OPEN_MODAL, name: 'walletManager' });
  };

  if (account) {
    return (
      <button className="btn" onClick={toggleWalletModal}>
        {shortenAddress(account)}
        {connector && <StatusIcon connector={connector} />}
      </button>
    );
  }
  if (error) {
    return <div>{error instanceof UnsupportedChainIdError ? 'Wrong Network' : 'Error'}</div>;
  }
  return (
    <button className="btn vibrate" onClick={toggleWalletModal}>
      Connect to a wallet
    </button>
  );
}

export default function Web3Status() {
  const { active } = useWeb3React();
  const contextNetwork = useWeb3React(NetworkContextName);

  if (!contextNetwork.active && !active) {
    return null;
  }

  return <Web3StatusInner />;
}
