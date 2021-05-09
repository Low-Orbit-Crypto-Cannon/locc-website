import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useSound } from 'use-sound';
import { GITHUB_LINK, MEDIUM_LINK, TWITTER_LINK, TELEGRAM_LINK } from 'src/constants';

import FooterBg from 'src/assets/images/footer.png';
import LoccLogo from 'src/assets/images/logo-locc.svg';

import PropulsionSound from 'src/assets/sounds/propulsion.mp3';

const Footer = () => {
  const [playbackRate, setPlaybackRate] = useState(0.9);
  const [play, { stop }] = useSound(PropulsionSound, { playbackRate, interrupt: true });

  const soundEnabled = useSelector(state => state.app.soundEnabled);
  useEffect(() => {
    if (!soundEnabled) stop();
  }, [soundEnabled]);

  const handleClick = () => {
    if (soundEnabled) {
      setPlaybackRate(playbackRate + 0.1);
      play();
    }
  };

  return (
    <footer id="f">
      <img src={FooterBg} />
      <div className="ct">
      <ul>
          <li><a href={GITHUB_LINK} target="_blank"><i className="fab fa-github"></i></a></li>
          <li><a href={MEDIUM_LINK} target="_blank"><i className="fab fa-medium-m"></i></a></li>
          <li><a href={TELEGRAM_LINK} target="_blank"><i className="fab fa-telegram-plane"></i></a></li>
          <li><a href={TWITTER_LINK} target="_blank"><i className="fab fa-twitter"></i></a></li>
        </ul>
        <img src={LoccLogo} className="footer-logo" alt="LOCC Logo" onClick={handleClick} />
        <p>LOCC © 2021. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
