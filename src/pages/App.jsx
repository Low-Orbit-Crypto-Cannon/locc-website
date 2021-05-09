import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Home from 'src/pages/Home';
import Staking from 'src/pages/Staking';

import SoundHelper from 'src/components/SoundHelper';

import Header from 'src/components/Header';
import Footer from 'src/components/Footer';

import Web3ReactManager from 'src/components/Web3ReactManager';
import PropulsionManager from 'src/components/PropulsionManager';
import WalletManager from 'src/components/Modals/WalletManager';

const App = () => {
  return (
    <>
      <Toaster
        position={'bottom-center'}
        reverseOrder={false}
        toastOptions={{
          style: { background: 'rgb(31, 33, 37)', color: '#fff' },
          duration: 3000,
          loading: { duration: 900000 },
          success: { duration: 3000 },
          error: { duration: 4000 },
        }}
      />
      <SoundHelper />

      <Header />

      <Web3ReactManager>
        <PropulsionManager>
          <Switch>
            <Route exact path="/">
              <Home />
            </Route>

            <Route path="/home">
              <Home />
            </Route>
            <Route path="/staking">
              <Staking />
            </Route>

            <Route>
              <Home />
            </Route>
          </Switch>
        </PropulsionManager>
      </Web3ReactManager>

      <Footer />

      <WalletManager />
    </>
  );
};

/*
App.propTypes = {
  onLogoutRequested: PropTypes.func,
  isLogged: PropTypes.bool,
};


const mapStateToProps = state => {
  return {
    isLogged: state.web3.isLogged,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onLogoutRequested: () => {
      dispatch({
        type: SET_LOGGED,
        isConnected: false,
        accounts: [],
        netId: 1,
      });

      dispatch({
        type: SET_LOCC_BALANCE,
        balance: 0,
      });
    },
  };
};
*/

export default App;
