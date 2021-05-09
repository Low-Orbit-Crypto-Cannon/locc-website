import { SET_IS_PROPELLED, SET_LOCC_BALANCE, SET_SOUND_ENABLED } from '../mutations';

const initialState = {
  loccBalance: 0,
  isPropelled: false,
  soundEnabled: true
};

export default (state = initialState, action) => {
  switch (action.type) {
    case SET_LOCC_BALANCE:
      return {
        ...state,
        loccBalance: action.balance
      };
    case SET_IS_PROPELLED:
      return {
        ...state,
        isPropelled: action.isPropelled
      };
    case SET_SOUND_ENABLED:
      return {
        ...state,
        soundEnabled: action.enabled
      };
    default:
      return state;
  }
};
