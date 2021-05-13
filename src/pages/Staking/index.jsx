import React, { useEffect, useState } from 'react';
import { useLoccBalance } from 'src/hooks/useLoccBalance';
import { LOCC_TOKEN_DECIMALS, LOCC_TOKEN, LOCC_PROPULSOR_V2, LOCC_PROPULSOR_V1 } from 'src/constants';
import { useTokenContract, usePropulsorContract } from 'src/hooks/useContract';
import { useActiveWeb3React } from 'src/hooks';
import { utils } from 'ethers';
import toast from 'react-hot-toast';
import capitalize from 'capitalize-sentence';

import Web3Status from 'src/components/Web3Status';

import LoccTokenLogo from 'src/assets/images/logo-locc-token.png';

const Staking = () => {
  const { account, chainId } = useActiveWeb3React();
  const { loccBalance, refreshBalance } = useLoccBalance();

  const tokenContractAddr = LOCC_TOKEN[chainId];
  const tokenContract = useTokenContract(tokenContractAddr);

  const propulsorV2ContractAddr = LOCC_PROPULSOR_V2[chainId];
  const propulsorV2Contract = usePropulsorContract(propulsorV2ContractAddr);

  const propulsorV1ContractAddr = LOCC_PROPULSOR_V1[chainId];
  const propulsorV1Contract = usePropulsorContract(propulsorV1ContractAddr);

  const [amountToMigrate, setAmountToMigrate] = useState(0);
  const [stakedAmount, setStakedAmount] = useState(0);
  const [earnedAmount, setEarnedAmount] = useState(0);
  const [minStakingToBePropelled, setMinStakingToBePropelled] = useState(0);

  const refreshEarnedAmount = () => {
    propulsorV2Contract.getEarnedAmountByAddr(account).then(async (earnedAmountV2) => {
      const earnedAmountV2Format = parseFloat(utils.formatUnits(earnedAmountV2, 18));

      const earnedAmountV1 = await propulsorV1Contract.getEarnedAmountByAddr(account);
      const earnedAmountV1Format = parseFloat(utils.formatUnits(earnedAmountV1, 18)) ?? 0;
      
      setEarnedAmount(earnedAmountV2Format + earnedAmountV1Format);
    });
  }

  const refreshStakingInfos = () => {
    propulsorV2Contract.getMinStakingToBePropelled().then(minStakingToBePropelled => {
      const _minStakingToBePropelledFormat = parseFloat(utils.formatUnits(minStakingToBePropelled, 18));
      const minStakingToBePropelledFormat = (_minStakingToBePropelledFormat * 1.12).toFixed(3);
      setMinStakingToBePropelled(minStakingToBePropelledFormat);
    });

    if (account) {
      propulsorV2Contract.getStakedAmountByAddr(account).then(stakedAmount => {
        const stakedAmountFormat = parseFloat(utils.formatUnits(stakedAmount, 18));
        setStakedAmount(stakedAmountFormat);
      });

      propulsorV1Contract.getStakedAmountByAddr(account).then(amountToMigrate => {
        const amountToMigrateFormat = parseFloat(utils.formatUnits(amountToMigrate, 18));
        setAmountToMigrate(amountToMigrateFormat);
      });
  
      refreshEarnedAmount();
    }
  };

  const [isDepositLoading, setIsDepositLoading] = useState(false);

  /************* allowance **************/

  const [contractAllowed, setContractAllowed] = useState(false);

  const checkContractAllowance = async () => {
    setIsDepositLoading(true);
    const allowance = await tokenContract.allowance(account, propulsorV2Contract.address);
    const allowanceFormat = utils.formatUnits(allowance, 18);

    const contractAllowed = parseFloat(allowanceFormat) !== 0;
    setContractAllowed(contractAllowed);
    setIsDepositLoading(false);
  };

  const requestAllowance = async () => {
    const wei = utils.parseEther('1000');

    try {
      setIsDepositLoading(true);
      const approveTx = await tokenContract.approve(propulsorV2Contract.address, wei);
      const approveTxWait = approveTx.wait();

      toast.promise(
        approveTxWait,
        {
          loading: 'Approvement in progress',
          success: 'Successfully approved',
          error: 'An has error occurred during your approval',
        },
        {
          style: { minWidth: '215px', maxWidth: '400px' },
        }
      );

      const approveResult = await approveTxWait;
      setIsDepositLoading(false);

      if (approveResult?.status === 1) {
        setContractAllowed(true);
      }
    } catch (err) {
      console.error(err);
      if (err.reason || err.message) toast.error(capitalize(err.reason || err.message));

      setIsDepositLoading(false);
    }
  };

  /************* deposit **************/

  const deposit = async amount => {
    if (!amount || amount <= 0) return;

    const wei = utils.parseEther(amount);

    try {
      setIsDepositLoading(true);
      const depositTx = await propulsorV2Contract.deposit(wei);
      const depositTxWait = depositTx.wait();

      toast.promise(
        depositTxWait,
        {
          loading: 'Deposit in progress',
          success: 'Successfully deposited',
          error: 'An has error occurred during your deposit',
        },
        {
          style: { minWidth: '215px', maxWidth: '400px' },
        }
      );

      const depositResult = await depositTxWait;
      setIsDepositLoading(false);

      if (depositResult?.status === 1) {
        setAmount(0);
        setIsErrored(true);
        
        refreshBalance();
        refreshStakingInfos();
      }
    } catch (err) {
      console.error(err);
      if (err.reason || err.message) toast.error(capitalize(err.reason || err.message));

      setIsDepositLoading(false);
    }
  };

  /************* migrate **************/

  const [isMigrationLoading, setIsMigrationLoading] = useState(false);

  const migrate = async amount => {
    try {
      setIsMigrationLoading(true);
      const migrateTx = await propulsorV1Contract.withdraw();
      const migrateTxWait = migrateTx.wait();

      toast.promise(
        migrateTxWait,
        {
          loading: 'Migration in progress',
          success: 'Successfully migrated',
          error: 'An has error occurred during your migration',
        },
        {
          style: { minWidth: '215px', maxWidth: '400px' },
        }
      );

      const migrateResult = await migrateTxWait;
      setIsMigrationLoading(false);

      if (migrateResult?.status === 1) {
        refreshBalance();
        refreshStakingInfos();
      }
    } catch (err) {
      console.error(err);
      if (err.reason || err.message) toast.error(capitalize(err.reason || err.message));

      setIsMigrationLoading(false);
    }
  };

  /************* withdraw **************/

  const [isWithdrawLoading, setIsWithdrawLoading] = useState(false);

  const withdraw = async amount => {
    try {
      setIsWithdrawLoading(true);
      const withdrawTx = await propulsorV2Contract.withdraw();
      const withdrawTxWait = withdrawTx.wait();

      toast.promise(
        withdrawTxWait,
        {
          loading: 'Withdraw in progress',
          success: 'Successfully withdrawn',
          error: 'An has error occurred during your withdraw',
        },
        {
          style: { minWidth: '215px', maxWidth: '400px' },
        }
      );

      const withdrawResult = await withdrawTxWait;
      setIsWithdrawLoading(false);

      if (withdrawResult?.status === 1) {
        refreshBalance();
        refreshStakingInfos();
      }
    } catch (err) {
      console.error(err);
      if (err.reason || err.message) toast.error(capitalize(err.reason || err.message));

      setIsWithdrawLoading(false);
    }
  };

  /************* form **************/

  const [amount, setAmount] = useState(0);
  const [isErrored, setIsErrored] = useState(true);

  const onAmountChange = e => {
    const _amount = e.target.value;

    if (_amount < 0) {
      setIsErrored(true);
      return;
    }

    if (_amount > 0 && _amount <= loccBalance && _amount >= minStakingToBePropelled) setIsErrored(false);
    else setIsErrored(true);

    setAmount(_amount);
  };

  const onSubmit = () => {
    if (!contractAllowed) {
      requestAllowance();
      return;
    }

    deposit(amount);
  };

  /************* init **************/

  useEffect(() => {
    if (account) checkContractAllowance();
    if (!account) {
      setIsErrored(true);
      setAmount(0);

      setAmountToMigrate(0);
      setStakedAmount(0);
      setEarnedAmount(0);
    }
  }, [account]);

  useEffect(() => {
    refreshStakingInfos();

    const refreshInterval = setInterval(() => {
      if (account) refreshEarnedAmount();
    }, 6000);

    return () => clearInterval(refreshInterval);
  }, [account, chainId]);

  let depositBtnText = ``;
  if (isErrored) depositBtnText = 'Invalid amount';
  else if (!contractAllowed) depositBtnText = 'Approve';
  else depositBtnText = 'Deposit 🚀';

  return (
    <main className="staking-wrapper">
      <div id="pg">
        <div className="ct" style={{ marginTop: -50 }}>
          <div className="sub">Low Orbit Crypto Cannon Propulsion Staking</div>
          <h1>Ready for the next propulsion ?</h1>
          <div className="p">
            <p>
              Stake your <span style={{ fontWeight: 600 }}>LOCC</span> on the Propulsor Contract and take your chance to participate in the next propulsion wave,
              <br />
              <span style={{ fontWeight: 600 }}>you might be the next astronaut who will win all of the wave collected fees.</span>.
              <br/>
              Everyone has an equal chance to win!
            </p>
            <p style={{ marginTop: 8, fontStyle: 'italic' }}>
              If you're the winner, tokens will be directly sent to your wallet.
            </p>
            <p className="alert-info">
              A minimum deposit of <span style={{ fontWeight: 600 }}>{minStakingToBePropelled} LOCC</span>{' '}
              <span style={{textDecoration: 'underline'}}>including fees</span> is required to join the party!<br/>
            </p>
          </div>
          <div id="dp">
            <div className="dpt">
              <div className="in">
                <strong>{loccBalance.toFixed(LOCC_TOKEN_DECIMALS)}</strong>
                <small>
                  $LOCC <img src={LoccTokenLogo} className="lcc" alt="LOCC" />
                </small>
              </div>
              <Web3Status />
            </div>
            <div className="dpc">
              <div className="stak">
                <h2 className="ti">Your staked balance</h2>
                <div className="in">
                  <strong>{stakedAmount.toFixed(LOCC_TOKEN_DECIMALS)}</strong>
                  <small>
                    $LOCC <img src={LoccTokenLogo} className="lcc" alt="LOCC" />
                  </small>
                </div>
                <button
                  className={`btn ${(isWithdrawLoading || !stakedAmount || stakedAmount <= 0) && 'disabled'}`}
                  disabled={isWithdrawLoading || !stakedAmount || stakedAmount <= 0}
                  onClick={withdraw}
                >
                  {isWithdrawLoading ? (
                    <>
                      Loading <i className="fal fa-sun fa-spin"></i>
                    </>
                  ) : (
                    <>Withdraw</>
                  )}
                </button>
                {' '}
                {amountToMigrate > 0 &&
                  <button
                    className={`btn ${(isMigrationLoading || !amountToMigrate || amountToMigrate <= 0) && 'disabled'}`}
                    disabled={isMigrationLoading || !amountToMigrate || amountToMigrate <= 0}
                    onClick={migrate}
                  >
                    {isWithdrawLoading ? (
                      <>
                        Loading <i className="fal fa-sun fa-spin"></i>
                      </>
                    ) : (
                      <>Migrate</>
                    )}
                  </button>
                }
              </div>
              <div className="his">
                <h2 className="ti">Your earned balance</h2>
                <div className="in">
                  <strong>{earnedAmount.toFixed(LOCC_TOKEN_DECIMALS)}</strong>
                  <small>
                    $LOCC <img src={LoccTokenLogo} className="lcc" alt="LOCC" />
                  </small>
                </div>
              </div>
              <div className="dep">
                <fieldset>
                  <label htmlFor="depp" className="ti">
                    Enter an amount to stake {/* <img src={LoccTokenLogo} className="lcc" alt="LOCC" /> */}
                  </label>
                  <input id="depp" className="in inn" name="amount" type="number" placeholder="0.00000000"
                    disabled={!account} value={amount} onChange={e => onAmountChange(e)} />
                  <span></span>
                  <button className={`btn ${(isDepositLoading || isErrored) && 'disabled'}`} disabled={isDepositLoading || isErrored} onClick={onSubmit}>
                    {isDepositLoading ? (
                      <>
                        Loading <i className="fal fa-sun fa-spin"></i>
                      </>
                    ) : (
                      <>{depositBtnText}</>
                    )}
                  </button>
                </fieldset>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Staking;
