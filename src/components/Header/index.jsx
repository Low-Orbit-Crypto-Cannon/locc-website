import React, { useCallback, useEffect, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChainId } from '@uniswap/sdk';
import { GITHUB_LINK, MEDIUM_LINK, TELEGRAM_LINK, TWITTER_LINK, UNISWAP_BUY_LINK } from 'src/constants';

import LoccLogo from 'src/assets/images/logo-locc.svg';

const Header = () => {
  const body = document.querySelector('body');

  const addFx = useCallback(() => {
    const { scrollTop } = body;
    scrollTop > 0 ? body.classList.add('fx') : body.classList.remove('fx');
  });

  useEffect(() => {
    body.addEventListener('resize', addFx);
    body.addEventListener('scroll', addFx);
    body.addEventListener('load', addFx);

    return () => {
      body.removeEventListener('resize', addFx);
      body.removeEventListener('scroll', addFx);
      body.removeEventListener('load', addFx);
    };
  }, [addFx]);

  let nav = null;
  const toggleNav = useCallback(() => {
    body.classList.toggle('onav');
  });

  useLayoutEffect(() => {
    nav = document.querySelector('[data-nav]');
  }, []);

  useEffect(() => {
    if (!nav) return;
    nav.addEventListener('click', toggleNav);

    return () => {
      nav.removeEventListener('click', toggleNav);
    };
  }, [toggleNav, nav]);

  return (
    <header id="h">
      <div className="t">
      <ul>
          <li><a href={TELEGRAM_LINK} target="_blank"><i className="fab fa-telegram-plane"></i></a></li>
          <li><a href={TWITTER_LINK} target="_blank"><i className="fab fa-twitter"></i></a></li>
          <li><a href={GITHUB_LINK} target="_blank"><i className="fab fa-github"></i></a></li>
          <li><a href={MEDIUM_LINK} target="_blank"><i className="fab fa-medium"></i></a></li>
      </ul>
      </div>

      <div className="b">
        <div className="l">
          <Link to="/" className="lo">
            <img src={LoccLogo} alt="LOCC Logo" />
          </Link>
        </div>

        <div className="r">
          <nav id="n">
          <ul>
                <li><Link to="/">Home</Link></li>
                <li><a href={TELEGRAM_LINK} title="The most active social networks for the LOCC community">Telegram</a></li>
                <li><a href="/orbit_paper.pdf" title="Lite Paper of the LOCC Protocol">Orbit Paper</a></li>
                {/* <li><a href="#" title="Tutorial about how to buy and use the LOCC token">How to Buy</a></li> */}
                <li><a href="https://github.com/Low-Orbit-Crypto-Cannon/locc-contracts" title="Open-Source code of the LOCC Contracts" target="_blank">LOCC Contract</a></li>
                <li><a href="/Low_Orbit_Crypto_Cannon_Smart_Contract_Security_Audit_Report.pdf" title="Smart-Contracts Audit of LOCC Protocol" target="_blank">Audits</a></li>
                <li>
                  <a href={UNISWAP_BUY_LINK}>
                    <span>Buy $LOCC <i className="fal fa-arrow-right"></i></span>
                  </a>
                </li>
            </ul>
          </nav>
          <button data-nav>
            <i className="fal fa-bars"></i>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
