import { createStore, combineReducers, applyMiddleware } from 'redux';
import rootReducer from './rootReducer';

const logger = store => next => action => {
  console.log('dispatching', action);
  let result = next(action);
  console.log('next state', store.getState());
  return result;
};

const reducers = combineReducers(rootReducer);

const store = createStore(reducers, applyMiddleware(logger));

export default store;
