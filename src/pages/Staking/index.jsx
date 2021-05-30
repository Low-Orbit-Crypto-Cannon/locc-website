import React, { useEffect, useState } from 'react';
import { useLoccBalance } from 'src/hooks/useLoccBalance';
import { LOCC_TOKEN_DECIMALS, LOCC_TOKEN, LOCC_PROPULSOR_V2, LOCC_PROPULSOR_V1 } from 'src/constants';
import { useTokenContract, usePropulsorContract } from 'src/hooks/useContract';
import { useActiveWeb3React } from 'src/hooks';
import { usePendingTransactions, useTransactionAdder } from 'src/hooks/transactions';
import { utils } from 'ethers';
import { getInitialMsg, TX_SUBJECTS } from 'src/utils';
import toast from 'react-hot-toast';
import capitalize from 'capitalize-sentence';

import Web3Status from 'src/components/Web3Status';

import LoccTokenLogo from 'src/assets/images/logo-locc-token.png';
import { useSelector } from 'react-redux';

const Staking = () => {
  const { account, chainId } = useActiveWeb3React();
  const { loccBalance, refreshBalance } = useLoccBalance();
  const addTransaction = useTransactionAdder();

  const tokenContractAddr = LOCC_TOKEN[chainId];
  const tokenContract = useTokenContract(tokenContractAddr);

  const propulsorV2ContractAddr = LOCC_PROPULSOR_V2[chainId];
  const propulsorV2Contract = usePropulsorContract(propulsorV2ContractAddr);

  const propulsorV1ContractAddr = LOCC_PROPULSOR_V1[chainId];
  const propulsorV1Contract = usePropulsorContract(propulsorV1ContractAddr);

  const [amountToMigrate, setAmountToMigrate] = useState(0);
  const [stakedAmount, setStakedAmount] = useState(0);
  const [earnedAmount, setEarnedAmount] = useState(0);
  const [minStakingToBePropelledWithFees, setMinStakingToBePropelledWithFees] = useState(0);
  const [minStakingToBePropelled, setMinStakingToBePropelled] = useState(0);

  const refreshEarnedAmount = () => {
    propulsorV2Contract.getEarnedAmountByAddr(account).then(async earnedAmountV2 => {
      const earnedAmountV2Format = parseFloat(utils.formatUnits(earnedAmountV2, 18));

      const earnedAmountV1 = await propulsorV1Contract.getEarnedAmountByAddr(account);
      const earnedAmountV1Format = parseFloat(utils.formatUnits(earnedAmountV1, 18)) ?? 0;

      setEarnedAmount(earnedAmountV2Format + earnedAmountV1Format);
    });
  };

  const refreshStakingInfos = () => {
    propulsorV2Contract.getMinStakingToBePropelled().then(minStakingToBePropelled => {
      const minStakingToBePropelledFormat = parseFloat(utils.formatUnits(minStakingToBePropelled, 18));
      setMinStakingToBePropelled(minStakingToBePropelledFormat);

      const minStakingToBePropelledWithFeesFormat = (minStakingToBePropelledFormat * 1.12).toFixed(3);
      setMinStakingToBePropelledWithFees(minStakingToBePropelledWithFeesFormat);
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

  const [allowanceAmount, setAllowanceAmount] = useState(0);

  const checkContractAllowance = async () => {
    setIsDepositLoading(true);
    const allowance = await tokenContract.allowance(account, propulsorV2Contract.address);
    const allowanceFormat = utils.formatUnits(allowance, 18);

    setAllowanceAmount(parseFloat(allowanceFormat));
    setIsDepositLoading(false);
  };

  const requestAllowance = async () => {
    const wei = utils.parseEther('100000000');

    try {
      setIsDepositLoading(true);
      const approveTx = await tokenContract.approve(propulsorV2Contract.address, wei);

      toast.loading(getInitialMsg(chainId, approveTx.hash, TX_SUBJECTS.APPROVE), { id: approveTx.hash, style: { minWidth: '215px', maxWidth: '400px' } });
      addTransaction(approveTx, TX_SUBJECTS.APPROVE);

      const approveResult = await approveTx.wait();
      setIsDepositLoading(false);

      if (approveResult?.status === 1) {
        checkContractAllowance();
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

      toast.loading(getInitialMsg(chainId, depositTx.hash, TX_SUBJECTS.DEPOSIT), { id: depositTx.hash, style: { minWidth: '215px', maxWidth: '400px' } });
      addTransaction(depositTx, TX_SUBJECTS.DEPOSIT);

      const depositResult = await depositTx.wait();
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

  const migrate = async () => {
    try {
      setIsMigrationLoading(true);
      const migrateTx = await propulsorV1Contract.withdraw();

      toast.loading(getInitialMsg(chainId, migrateTx.hash, TX_SUBJECTS.MIGRATE), { id: migrateTx.hash, style: { minWidth: '215px', maxWidth: '400px' } });
      addTransaction(migrateTx, TX_SUBJECTS.MIGRATE);

      const migrateResult = await migrateTx.wait();
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

  const withdraw = async () => {
    try {
      setIsWithdrawLoading(true);
      const withdrawTx = await propulsorV2Contract.withdraw();

      toast.loading(getInitialMsg(chainId, withdrawTx.hash, TX_SUBJECTS.WITHDRAW), { id: withdrawTx.hash, style: { minWidth: '215px', maxWidth: '400px' } });
      addTransaction(withdrawTx, TX_SUBJECTS.WITHDRAW);

      const withdrawResult = await withdrawTx.wait();
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
    const rawAmount = e.target.value;
    const parsedAmount = parseFloat(rawAmount);

    if (parsedAmount < 0) {
      setIsErrored(true);
      return;
    }

    if (parsedAmount > 0 && parsedAmount <= loccBalance && parsedAmount >= minStakingToBePropelledWithFees) setIsErrored(false);
    else setIsErrored(true);

    setAmount(rawAmount);
  };

  const onSubmit = () => {
    if (allowanceAmount < minStakingToBePropelled || allowanceAmount < amount) {
      requestAllowance();
      return;
    }

    deposit(amount);
  };

  /************* pending **************/

  const [anyStateTxPending, setAnyStateTxPending] = useState(false);
  const pendingTransactions = usePendingTransactions();

  useEffect(() => {
    const pendingTransactionsKeys = Object.keys(pendingTransactions);
    if (pendingTransactionsKeys?.length > 0) setAnyStateTxPending(true);

    pendingTransactionsKeys.forEach(pendingTxHash => {
      const pendingTx = pendingTransactions[pendingTxHash];

      const now = new Date().getTime();
      if (pendingTx.addedTime <= new Date(now + (86400 * 1000))) {
        toast.loading(getInitialMsg(chainId, pendingTx.hash, pendingTx.subject), { id: pendingTx.hash, style: { minWidth: '215px', maxWidth: '400px' } });
      }
    });
  }, []);

  const transactions = useSelector(state => state.transactions);

  useEffect(() => {
    if (!account || !anyStateTxPending) return;

    checkContractAllowance();

    setAmount(0);
    setIsErrored(true);

    refreshBalance();
    refreshStakingInfos();
  }, [transactions]);

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
  else if (allowanceAmount < minStakingToBePropelled) depositBtnText = 'Approve';
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
              <span style={{ fontWeight: 600 }}>you might be the next astronaut who will win all of the wave collected fees.</span>
              <br />
              Everyone has an equal chance to win!
            </p>
            <p style={{ marginTop: 8, fontStyle: 'italic' }}>If you're the winner, tokens will be directly sent to your wallet.</p>
            <p className="alert-info">
              A minimum deposit of <span style={{ fontWeight: 600 }}>{minStakingToBePropelledWithFees} LOCC</span> <span style={{ textDecoration: 'underline' }}>including fees</span> is
              required to join the party 🎉
              <br />
              <span style={{ fontSize: '0.9em' }}>
                This will stake the <span style={{ fontWeight: 600 }}>{minStakingToBePropelled} LOCC</span> required to be an Astronaut waiting on deck!
              </span>
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
                </button>{' '}
                {amountToMigrate > 0 && (
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
                )}
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
                  <input id="depp" className="in inn" name="amount" type="number" placeholder="0.00000000" disabled={!account} value={amount} onChange={e => onAmountChange(e)} />
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
