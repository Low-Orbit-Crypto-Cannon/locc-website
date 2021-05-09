import { ChainId, Token } from '@uniswap/sdk';
import { fortmatic, injected, portis, walletconnect, walletlink } from 'src/connectors';

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

// Block time here is slightly higher (~1s) than average in order to avoid ongoing proposals past the displayed time
export const AVERAGE_BLOCK_TIME_IN_SECS = 13;

export const LOCC_API_SUMMARY_ENDPOINT = 'https://api.loworbit.finance/front/token';

export const LOCC_TOKEN_TOTAL_SUPPLY = 1000;
export const LOCC_TOKEN_DECIMALS = 8;

export const LOCC_TOKEN = {
  [ChainId.MAINNET]: '0x556938621C19e5eae58C94a806da9d237b969bd8',
  [ChainId.ROPSTEN]: '0x6ef15d1ed7ae15113bed08a548844e0991e62f4f',
};

export const LOCC_PROPULSOR = {
  [ChainId.MAINNET]: '0x5d68FE6E6FF4f869B689132Cd8fecC5b6418b839',
  [ChainId.ROPSTEN]: '0xb3EA82a250B7E4f11e445246deF72678114db452',
};

export const getLoccToken = chainId => {
  return new Token(chainId, LOCC_TOKEN[chainId], 18, 'LOCC', 'Locc');
};

export const SUPPORTED_WALLETS = {
  INJECTED: {
    connector: injected,
    name: 'Injected',
    iconName: 'arrow-right.svg',
    description: 'Injected web3 provider.',
    href: null,
    color: '#010101',
    primary: true,
  },
  METAMASK: {
    connector: injected,
    name: 'MetaMask',
    iconName: 'metamask.png',
    description: 'Easy-to-use browser extension.',
    href: null,
    color: '#E8831D',
  },
  WALLET_CONNECT: {
    connector: walletconnect,
    name: 'WalletConnect',
    iconName: 'walletConnectIcon.svg',
    description: 'Connect to Trust Wallet, Rainbow Wallet and more...',
    href: null,
    color: '#4196FC',
    mobile: true,
  },
  WALLET_LINK: {
    connector: walletlink,
    name: 'Coinbase Wallet',
    iconName: 'coinbaseWalletIcon.svg',
    description: 'Use Coinbase Wallet app on mobile device',
    href: null,
    color: '#315CF5',
  },
  COINBASE_LINK: {
    name: 'Open in Coinbase Wallet',
    iconName: 'coinbaseWalletIcon.svg',
    description: 'Open in Coinbase Wallet app.',
    href: 'https://go.cb-w.com/mtUDhEZPy1',
    color: '#315CF5',
    mobile: true,
    mobileOnly: true,
  },
  FORTMATIC: {
    connector: fortmatic,
    name: 'Fortmatic',
    iconName: 'fortmaticIcon.png',
    description: 'Login using Fortmatic hosted wallet',
    href: null,
    color: '#6748FF',
    mobile: true,
  },
  Portis: {
    connector: portis,
    name: 'Portis',
    iconName: 'portisIcon.png',
    description: 'Login using Portis hosted wallet',
    href: null,
    color: '#4A6C9B',
    mobile: true,
  },
};

export const NetworkContextName = 'NETWORK';

export const TELEGRAM_LINK = 'https://t.me/loworbit_crypto';
export const TWITTER_LINK = 'https://twitter.com/loworbit_crypto';
export const MEDIUM_LINK = 'https://medium.com/@loworbit/about';
export const GITHUB_LINK = 'https://github.com/Low-Orbit-Crypto-Cannon';

export const UNISWAP_BUY_LINK = '#';
