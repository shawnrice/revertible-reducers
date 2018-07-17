import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import { promiseMiddleware } from './modules/revertibleReducer';

import rootReducer from './rootReducer';
import client from '../client';

const logger = store => next => action => {
  console.log('dispatching', action);
  let result = next(action);
  console.log('next state', store.getState());
  return result;
};

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const reducers = combineReducers(rootReducer);

const store = createStore(
  reducers,
  composeEnhancers(applyMiddleware(logger, promiseMiddleware(client)))
);

export default store;
