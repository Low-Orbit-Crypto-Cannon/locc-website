import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useSound } from 'use-sound';
import { useActiveWeb3React } from 'src/hooks';
import { usePropulsorContract, useTokenContract } from 'src/hooks/useContract';
import {
  LOCC_TOKEN_TOTAL_SUPPLY,
  LOCC_TOKEN,
  LOCC_PROPULSOR,
  LOCC_TOKEN_DECIMALS,
  AVERAGE_BLOCK_TIME_IN_SECS,
  LOCC_API_SUMMARY_ENDPOINT,
  UNISWAP_BUY_LINK,
  TELEGRAM_LINK,
} from 'src/constants';
import { utils } from 'ethers';
import { getEtherscanLink, shortenAddress } from 'src/utils';
import axios from 'axios';

import SweepSound from 'src/assets/sounds/sweep.mp3';
import MoonSound from 'src/assets/sounds/moon.mp3';

import PlanetBg from 'src/assets/images/planet.png';
import WinnerSvg from 'src/assets/images/winner.svg';
import MoonImg from 'src/assets/images/moon.png';
import PlanetsImg from 'src/assets/images/planets.png';
import StarGif from 'src/assets/images/star.gif';
import AstroRmImg from 'src/assets/images/astro-rm.png';
import AstroMoImg from 'src/assets/images/astro-mo.png';

const MoonSoundWrapper = () => {
  const [play, { stop }] = useSound(MoonSound, { volume: 0.6, interrupt: true });

  const soundEnabled = useSelector(state => state.app.soundEnabled);
  useEffect(() => {
    if (!soundEnabled) stop();
  }, [soundEnabled]);

  return <img src={AstroRmImg} onClick={() => soundEnabled && play()} style={{cursor: 'pointer'}} />;
};

const Home = () => {
  const { account, chainId, library } = useActiveWeb3React();

  const tokenContractAddr = LOCC_TOKEN[chainId];
  const tokenContract = useTokenContract(tokenContractAddr);

  const propulsorContractAddr = LOCC_PROPULSOR[chainId];
  const propulsorContract = usePropulsorContract(propulsorContractAddr);

  /************* stats **************/

  const [price, setPrice] = useState(0);
  const [hodlers, setHodlers] = useState(0);
  const [marketCap, setMarketCap] = useState(0);
  const [burned, setBurned] = useState(0);

  const refreshStats = async () => {
    const totalSupply = await tokenContract.totalSupply();
    const totalSupplyFormat = parseFloat(utils.formatUnits(totalSupply, 18));

    const { data } = await axios.get(LOCC_API_SUMMARY_ENDPOINT);
    if (data && data.result) {
      const price = data.uni.loccPrice;
      setPrice(price);

      setHodlers(data.etherscan.addresses);
      setMarketCap(price ? (price * totalSupplyFormat) : (2500 * totalSupplyFormat));
      setBurned(LOCC_TOKEN_TOTAL_SUPPLY - totalSupplyFormat);
    }
  };

  /************* propulsions **************/

  const [minStakingToBePropelled, setMinStakingToBePropelled] = useState(0);
  const [lastPropulsionBlock, setLastPropulsionBlock] = useState(0);
  const [blocksBetweenPropulsion, setBlocksBetweenPropulsion] = useState(0);
  const [remainingSecondsForPropulsion, setRemainingSecondsForPropulsion] = useState(-1);
  const [fuelToWin, setFuelToWin] = useState(0);

  const refreshFuelToWin = ({ preventReset } = { preventReset: false }) => {
    propulsorContract.getFuelToWin().then(fuelToWin => {
      const fuelToWinFormat = parseFloat(utils.formatUnits(fuelToWin, 18));
      if (preventReset && fuelToWinFormat < fuelToWin) return;

      setFuelToWin(fuelToWinFormat);
    });
  };

  const refreshPropulsionsInfos = async () => {
    propulsorContract.getMinStakingToBePropelled().then(minStakingToBePropelled => {
      const minStakingToBePropelledFormat = parseFloat(utils.formatUnits(minStakingToBePropelled, 18));
      setMinStakingToBePropelled(minStakingToBePropelledFormat);
    });

    propulsorContract.getBlocksBetweenPropulsion().then(blocksBetweenPropulsion => {
      const blocksBetweenPropulsionNumber = blocksBetweenPropulsion.toNumber();
      setBlocksBetweenPropulsion(blocksBetweenPropulsionNumber);
    });

    const lastPropulsionBlock = await propulsorContract.getBlockLastPropulsion();
    const lastPropulsionBlockNumber = lastPropulsionBlock.toNumber();
    setLastPropulsionBlock(lastPropulsionBlockNumber);
  };

  const onPropulsionStart = () => {
    setRemainingSecondsForPropulsion(0);
  };

  const onPropulsionEnd = async () => {
    refreshFuelToWin();
    refreshHistory();

    await refreshPropulsionsInfos();
    refreshTimer();
  };

  useEffect(() => {
    window.addEventListener('StakerPropelledStart', onPropulsionStart);
    window.addEventListener('StakerPropelledEnd', onPropulsionEnd);
    return () => {
      window.removeEventListener('StakerPropelledEnd', onPropulsionEnd);
      window.removeEventListener('StakerPropelledStart', onPropulsionStart);
    };
  }, []);

  /************* timer **************/

  const [remainingHours, setRemainingHours] = useState('00');
  const [remainingMinutes, setRemainingMinutes] = useState('00');
  const [remainingSeconds, setRemainingSeconds] = useState('00');
  const [remainingMillis, setRemainingMillis] = useState('0');

  const isReady = useMemo(() => remainingHours == '00' && remainingMinutes == '00' && remainingSeconds == '00' && remainingMillis == '00', [
    remainingHours,
    remainingMinutes,
    remainingSeconds,
    remainingMillis,
  ]);

  useEffect(() => {
    const nextPropulsion = new Date().getTime() + remainingSecondsForPropulsion * 1000;
    const ms = 10,
      s = 1000,
      m = s * 60,
      h = m * 60,
      d = h * 24;

    const timerInterval = setInterval(() => {
      const now = new Date().getTime();
      const remainingMs = nextPropulsion - now;

      let hours = 0,
        minutes = 0,
        seconds = 0,
        millis = 0;
      if (remainingMs >= 0) {
        hours = Math.floor((remainingMs % d) / h);
        minutes = Math.floor((remainingMs % h) / m);
        seconds = Math.floor((remainingMs % m) / s);
        millis = Math.floor((remainingMs % s) / ms);
      }

      setRemainingHours(hours.toString().padStart(2, '0'));
      setRemainingMinutes(minutes.toString().padStart(2, '0'));
      setRemainingSeconds(seconds.toString().padStart(2, '0'));
      setRemainingMillis(millis.toString().padStart(2, '0'));
    }, 0);

    return () => clearInterval(timerInterval);
  }, [remainingSecondsForPropulsion]);

  async function refreshTimer() {
    const currentBlock = await library.getBlockNumber();
    const elapsedBlockSinceLastPropulsion = currentBlock - lastPropulsionBlock;

    let remainingBlocksForPropulsion = blocksBetweenPropulsion - elapsedBlockSinceLastPropulsion;
    if (remainingBlocksForPropulsion < 0) remainingBlocksForPropulsion = 0;

    setRemainingSecondsForPropulsion(remainingBlocksForPropulsion * AVERAGE_BLOCK_TIME_IN_SECS);
  }

  useEffect(() => {
    if (lastPropulsionBlock == 0 || blocksBetweenPropulsion == 0) return;

    refreshTimer();

    const refreshInterval = setInterval(() => {
      refreshTimer();
    }, 6000);

    return () => clearInterval(refreshInterval);
  }, [lastPropulsionBlock, blocksBetweenPropulsion]);

  /************* history **************/

  const [history, setHistory] = useState([]);

  const refreshHistory = async () => {
    try {
      const stakerPropelledTopic = propulsorContract.filters.StakerPropelled().topics[0];

      const contractLogs = await library.getLogs({
        address: propulsorContract.address,
        fromBlock: library.getBlockNumber().then(b => b - 6650),
        toBlock: 'latest',
        topics: [[stakerPropelledTopic]],
      });

      const lastPropulsions = await Promise.all(
        contractLogs
          .reverse()
          .slice(0, 3)
          .map(async x => {
            const parsedLog = propulsorContract.interface.parseLog(x);
            const fuelEarnedFormat = parseFloat(utils.formatUnits(parsedLog.args.fuelEarned, 18)).toFixed(LOCC_TOKEN_DECIMALS);

            const block = await library.getBlock(x.blockHash);
            const date = Intl.DateTimeFormat('en-US', { month: 'long', day: '2-digit', hour: 'numeric', minute: 'numeric', hourCycle: 'h24' }).format(new Date(block.timestamp * 1000));

            return {
              name: parsedLog.name,
              transactionHash: x.transactionHash,
              date,
              astronaut: parsedLog.args.astronaut,
              reward: fuelEarnedFormat,
            };
          })
      );

      setHistory(lastPropulsions);
    } catch (err) {
      console.error(err);
    }
  };

  /************* init **************/

  useEffect(() => {
    refreshStats();
    refreshFuelToWin();
    refreshPropulsionsInfos();
    refreshHistory();

    const refreshInterval = setInterval(() => {
      refreshStats();
      refreshFuelToWin({ preventReset: true });
    }, 8000);

    return () => clearInterval(refreshInterval);
  }, [account, chainId]);

  /************* sound **************/

  const [play, { stop }] = useSound(SweepSound, { playbackRate: 1.35, volume: 0.6, interrupt: true });

  const soundEnabled = useSelector(state => state.app.soundEnabled);
  useEffect(() => {
    if (!soundEnabled) stop();
  }, [soundEnabled]);

  return (
    <main>
      <div id="ix">
        <div className="ct">
          <div className="sub">Welcome to</div>
          <h1>
            <strong>
              <span className="c-y">L</span>
              <span className="c-r">O</span>
              <span className="c-p">C</span>
              <span className="c-b">C</span>
            </strong>{' '}
            Protocol
            <small>Ready for The Orbit ?</small>
          </h1>

          <div className="tx">
            <p>
              Low Orbit Crypto Cannon is a crypto deflationary token made for the community, owned by the community, with a fair pre-sale in which everyone can participate.
            </p>
            <p style={{ marginTop: 10 }}>
              Ruled by simple, yet powerful and efficient smart contracts on the Ethereum blockchain: Fees are generated from each trade, partially burned, and then one staking Astronaut is selected for propulsion every 138 ETH blocks.
              <span style={{ fontWeight: 'bold', color: '#f4cf63' }}>This lucky Astronaut receives all of the collected fees!</span>
            </p>
            <p className="join-us">Join us on our journey to the solar system 🌞 !</p>
          </div>
          <a href={UNISWAP_BUY_LINK} className="btn">
            Buy $LOCC <i className="fal fa-arrow-right"></i>
          </a>

          <Link id="propulsator-link" to="/staking" className="btn-propulsor go" onMouseEnter={() => soundEnabled && play()} onMouseLeave={stop}>
            Propulsor 🚀 <i className="fal fa-arrow-right"></i>
          </Link>
        </div>
        <div className="ixi">
          <img src={PlanetBg} />
          <div className="bg"></div>
        </div>
      </div>
      <div id="nb">
        <div className="ct">
          <ul>
            <li>
              <div className="bck b-y">
                <i className="fal fa-wallet"></i>
              </div>
              <div>
                <div className="sub">LOCC Price</div>
                <strong className="c-y">
                  { !price && '~ $2500.00'}
                  { price && new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)}
                </strong>
              </div>
            </li>
            <li>
              <div className="bck b-r">
                <i className="fal fa-money-bill-wave"></i>
              </div>
              <div>
                <div className="sub">Number of hodlers</div>
                <strong className="c-r">{hodlers}</strong>
              </div>
            </li>
            <li>
              <div className="bck b-p">
                <i className="fal fa-store"></i>
              </div>
              <div>
                <div className="sub">Market Cap</div>
                <strong className="c-p">
                  { marketCap && new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(marketCap)}
                </strong>
              </div>
            </li>
            <li>
              <div className="bck b-b">
                <i className="fal fa-fire"></i>
              </div>
              <div>
                <div className="sub">Total LOCC burned</div>
                <strong className="c-b">{burned.toFixed(LOCC_TOKEN_DECIMALS)}</strong>
              </div>
            </li>
          </ul>
        </div>
      </div>
      <div id="w">
        <div className="ct">
          <div className="sub">Next Propulsion Wave</div>
          <time id="timer">
            {remainingSecondsForPropulsion < 0 && <span>Loading...</span>}
            {remainingSecondsForPropulsion >= 0 && isReady && <span>READY 🚀</span>}
            {remainingSecondsForPropulsion >= 0 && !isReady && (
              <>
                <span id="hours">{remainingHours}</span>:<span id="minutes">{remainingMinutes}</span>:<span id="seconds">{remainingSeconds}</span>:
                <span id="milli">{remainingMillis}</span>
              </>
            )}
          </time>
          <div className="csh">{fuelToWin.toFixed(LOCC_TOKEN_DECIMALS)} LOCC</div>
          <div className="sub">Previous Astronauts</div>
          <table className="tw">
            <thead>
              <tr>
                <th>Date</th>
                <th>Astronaut</th>
                <th>Reward</th>
              </tr>
            </thead>
            <tbody>
              {history.map(propulsion => {
                return (
                  <tr key={propulsion.transactionHash}>
                    <td className="tw-d">
                      <i className="fal fa-clock"></i> {propulsion.date}
                    </td>
                    <td className="tw-a">
                      <a href={getEtherscanLink(chainId, propulsion.astronaut, 'address')} target="_blank">
                        {shortenAddress(propulsion.astronaut)}
                      </a>
                    </td>
                    <td className="tw-w">{propulsion.reward} LOCC</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="wc">
          <div className="wca">
            <div className="wcaa">
              <img src={WinnerSvg} />
            </div>
            <div className="line">
              <span className="b-y"></span>
              <span className="b-r"></span>
              <span className="b-p"></span>
              <span className="b-b"></span>
            </div>
            <svg className="smo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 61.8 44.1">
              <circle className="sm1" cx="32.5" cy="26.6" r="17.5" fill="#f4ce63" />
              <circle className="sm2" cx="15.5" cy="15.5" r="15.5" fill="#d83c6f" />
              <circle className="sm3" cx="32.5" cy="23.4" r="9.6" fill="#0d5bc1" />
              <circle className="sm4" cx="24.5" cy="11.5" r="5.6" fill="#753598" />
              <circle className="sm5" cx="45.8" cy="11.5" r="9.1" fill="#d83c6f" />
              <circle className="sm6" cx="50" cy="22.8" r="6.8" fill="#753598" />
              <circle className="sm7" cx="54.9" cy="17.2" r="6.8" fill="#f4ce63" />
              <circle className="sm8" cx="50.5" cy="32.4" r="3.4" fill="#0d5bc1" />
            </svg>
          </div>
          <div className="wcm">
            <img className="moon" src={MoonImg} />
          </div>
          <img className="plnt" src={PlanetsImg} />
          <img className="star" src={StarGif} />
        </div>
      </div>
      <div id="rm">
        <div className="ct">
          <div className="rmc">
            <div className="l">
              <MoonSoundWrapper />
            </div>
            <div className="r">
              <div className="sub">Roadmap</div>
              <h2>Orbitmap LOCC</h2>
              <ul>
                <li>
                  <div className="ic bg-y" />
                  <div>
                    <div className="sub c-y">Q2 2021</div>
                    <h3 className="c-y">Orbit Initialization</h3>
                    <div className="p">
                      <dl>
                        <dd-road>Open-source release on Github of the contracts coded for $LOCC protocol</dd-road>
                        <dd-road>Auditing the Low Orbit Crypto Cannon Token (ERC-20) and the Low Orbit Propulsor Contract</dd-road>
                        <dd-road>Starting the LOCC Token Presale on Unicrypt Launchpad as public sale to kick-start the asset pool liquidity and the protocol</dd-road>
                        <dd-road>Deploying the Low Orbit Crypto Cannon Token on the Ethereum Network as an ERC-20 token with a max supply of 1000 $LOCC</dd-road>
                        <dd-road>Deploying the Low Orbit Propulsor Contract to collect fees from every transfer on the $LOCC token</dd-road>
                        <dd-road>Listing $LOCC token over several CEX</dd-road>
                        <dd-road>Listing over CMC, CoinGecko and Blockfolio</dd-road>
                      </dl>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="ic bg-r" />
                  <div>
                    <div className="sub c-r">Q3 2021</div>
                    <h3 className="c-r">Cannon Preparation</h3>
                    <div className="p">
                      <dl>
                        <dd-road>DAO Platform for Governance and more community driven decisions for Protocol evolution</dd-road>
                        <dd-road>Starting to code and deploy a $LOCC dApp to monitor the collected fees, burning states and more stats over the supply deflationary system</dd-road>
                        <dd-road>Integrating a mobile phone app to directly follow up your $LOCC propulsions and informations</dd-road>
                        <dd-road>Launching community incentives for sending more holders to the solar system</dd-road>
                      </dl>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="ic bg-p" />
                  <div>
                    <div className="sub c-p">Q4 2021</div>
                    <h3 className="c-p">Firing up Cannon in the Milky Way</h3>
                    <div className="p">
                      <dl>
                        <dd-road>Following community suggestions to adapt the development and the incentive of the protocol</dd-road>
                        <dd-road>Burning the 50% left $LOCC tokens allocated from the tokenomics</dd-road>
                        <dd-road>Applying to major Tier 1 exchanges for more exposure</dd-road>
                        <dd-road>Deploying a custom farming program for another incentive for the $LOCC token</dd-road>
                      </dl>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="ic bg-b" />
                  <div>
                    <div className="sub c-b">Q1 2022</div>
                    <h3 className="c-b">LOCC Presence on the entire Solar System</h3>
                    <div className="p">
                      <dl>
                        <dd-road>
                          By this time, we hope to have achieved a dominant position in our solar system.
                          <br />
                          Having created new <strong>millionaire astronauts</strong> - others will look up in envy and fear the cannon powers of the LOCC community.
                          <br />
                        </dd-road>
                        <dd style={{ marginTop: 6, fontSize: '1.1em', fontWeight: 'bolder' }}>One crypto asset to rule them all 🌟</dd>
                      </dl>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div id="mo">
        <div className="ct">
          <div className="moc">
            <div className="sub">Tokenomics of LOCC</div>
            <h2 className="h2">
              <i className="fal fa-coins" /> Orbinomics
            </h2>
            <ul>
              <li>
                <small>Total supply</small>
                <strong className="c-y">1000</strong>
              </li>
              <li>
                <small>Circulating supply</small>
                <strong className="c-r">800</strong>
              </li>
              <li>
                <small>Propulsion</small>
                <strong className="c-p">5%</strong>
              </li>
              <li>
                <small>Burned</small>
                <strong className="c-b">5%</strong>
              </li>
            </ul>
            <div className="p">
              <p>
                The total supply of the $LOCC token is 1000. As for the circulation supply, a good orbit cannon needs a proper economy: almost every $LOCC minted{' '}
                <span style={{ fontSize: '0.8em' }}>(800)</span> will be in circulation and will be completely used in the public sale.
                <br />
              </p>
              <dl>
                <dd>
                  Team wallet dev funds <i className="fal fa-long-arrow-alt-right" style={{ top: 1, marginLeft: 2, marginRight: 2 }}></i> 50 $LOCC{' '}
                  <span style={{ fontSize: '0.8em' }}>(5%)</span>
                </dd>
                <dd>
                  Marketing for growth and adoption <i className="fal fa-long-arrow-alt-right" style={{ top: 1, marginLeft: 2, marginRight: 2 }}></i> 50$ LOCC{' '}
                  <span style={{ fontSize: '0.8em' }}>(5%)</span>
                </dd>
                <dd>
                  Remaining treasury funds will be used in the public presale and added over the Uniswap liquidity{' '}
                  <span style={{ fontSize: '0.85em', fontWeight: 'bold' }}>(locked liquidity for 1 year)</span>{' '}
                  <i className="fal fa-long-arrow-alt-right" style={{ top: 1, marginLeft: 2, marginRight: 2 }}></i> 800 $LOCC <span style={{ fontSize: '0.8em' }}>(80%)</span>
                </dd>
              </dl>
              <p>
                There is a limit of 500 $LOCC burned to avoid the supply going to zero. This means that the market cap can be multiplied at each transfer and on token burning events.
              </p>
              <p style={{ fontStyle: 'italic' }}>"If you invested $100 in SafeMoon at launch it would now be worth 8 million dollars."</p>
            </div>
            <a href={UNISWAP_BUY_LINK} className="btn">
              Buy $LOCC <i className="fal fa-arrow-right"></i>
            </a>
          </div>
        </div>
        <img src={AstroMoImg} className="img" />
      </div>
      <div id="faq">
        <div className="ct">
          <div className="sub">F.A.Q</div>
          <h2 className="h2">Frequently Asked Questions</h2>
          <ul data-faq>
            <li>
              <h3 className="open">
                What is the Low Orbit Crypto Cannon Token utility?<i className="fal fa-plus"></i>
              </h3>
              <div className="p">
                <p>
                  We employ such simple functions, strong and powerful: each time a transfer occurs on the $LOCC ERC-20 token or any buy/sell occurring over Uniswap:
                  <dl>
                    <dd>- 5% of the amount is burned from the supply.</dd>
                    <dd>- 5% of the amount is sent to the Low Orbit Propulsor Contract for the next propulsion.</dd>
                  </dl>
                  The propulsion engine then starts to power up and load with the tokens collected from the transfer fees, ready to propel one of our hodlers into Orbit when the next
                  propulsion will trigger.
                </p>
              </div>
            </li>
            <li>
              <h3 className="open">
                What is the Low Orbit Propulsor Contract? <i className="fal fa-plus"></i>
              </h3>
              <div className="p">
                <p>The Low Orbit Propulsor Contract is a smart-contract that collect fees each time a transfer or a trade occurs on the $LOCC token.</p>
              </div>
            </li>
            <li>
              <h3 className="open">
                How to participate in the next propulsion wave? <i className="fal fa-plus"></i>
              </h3>
              <div className="p">
                <p>
                  To be able to join propulsion waves, and potentially win all the collected fees from trades and transfers, you need to stake a minimum of{' '}
                  <span style={{ fontWeight: 'bold' }}>{minStakingToBePropelled} $LOCC</span> in the Low Orbit Propulsor Contract on the{' '}
                  <Link to="/staking" style={{ color: '#007bff', textDecoration: 'underline' }}>
                    staking page
                  </Link>
                  .
                </p>
              </div>
            </li>
            <li>
              <h3 className="open">
                How to buy the LOCC token? <i className="fal fa-plus"></i>
              </h3>
              <div className="p">
                <p>You can buy the Low Orbit Crypto Cannon Token known as LOCC from Uniswap or any of the centralized exchanges where $LOCC is listed.</p>
              </div>
            </li>
          </ul>
        </div>
        <div style={{ fontSize: '1em', fontWeight: 'bold', marginTop: 42 }}>
          If you have any further questions, please do not hesitate to join our{' '}
          <a href={TELEGRAM_LINK} target="_blank" style={{ color: '#007bff', textDecoration: 'underline' }}>
            Telegram
          </a>
          .
        </div>
      </div>
    </main>
  );
};

export default Home;
