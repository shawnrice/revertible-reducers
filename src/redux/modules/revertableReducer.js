import { combineReducers } from 'redux';
import { client } from '../../client';
import { Map } from 'core-js';

function testForIE11() {
  const tmp = new Map();
  return typeof tmp.set('key', null) === 'undefined';
}

const testMap = new Map();
testMap.set({ tests: true }, 'testing');
console.log(new Map(testMap));
console.log(new Map(testMap) instanceof Map);
console.log('is differnt?', new Map(testMap) !== testMap);

const isIE11 = testForIE11();

// const copy = (map) => {
//   return isIE11 ?
// }

const shallowCopy = map => {
  // const newObj
  return new Map(map);
};

const addKey = (map, key, value) => {
  map.set(key, value);
  return new Map(map);
};

const addKeys = (map, arr) => {
  console.log(typeof map, map instanceof Map);
  for (let i = 0; i < arr.length; i++) {
    map.set(arr[i].id, arr[i]);
  }
  return new Map(map);
};

const removeKey = (map, key) => {
  map.delete(key);
  return new Map(map);
};

const replaceKey = (map, oldKey, data) => {
  map.delete(oldKey);
  map.set(data.id, data);
  return new Map(map);
};

const methods = ['LIST', 'CREATE', 'READ', 'UPDATE', 'DELETE'];

const initial = {
  pending: false,
  error: false,
  data: new Map(),
};

function startsWith(haystack, needle) {
  return haystack.indexOf(needle) === 0;
}
const rando = () => Math.random().toString(36);
const toJSON = res => res.json();
export function createReducer(name, urlMap) {
  const cache = new Map();

  const handleMethod = (method, { pending, success, failure }) => {
    const prefix = `@${name}/${method}`;

    return function subreducer(state, action) {
      console.log('IN REDUCER', prefix);
      if (action.type === `${prefix}/PENDING`) {
        cache.set(action.requestKey, action.data);
        return pending(state, action);
      }

      if (action.type === `${prefix}/SUCCESS`) {
        const __data = cache.get(action.requestKey);
        cache.delete(action.requestKey);
        return success(state, action, __data);
      }

      if (action.type === `${prefix}/FAILURE`) {
        const __data = cache.get(action.requestKey);
        cache.delete(action.requestKey);
        return failure(state, action, __data);
      }

      return state;
    };
  };

  const LIST = handleMethod('LIST', {
    pending: (state, action) => {
      return {
        ...state,
      };
    },
    success: (state, action, __data) => {
      return {
        ...state,
        data: addKeys(state.data, action.result),
      };
    },
    failure: (state, action, __data) => {
      return {
        ...state,
      };
    },
  });

  const CREATE = handleMethod('CREATE', {
    pending: (state, action) => {
      return {
        ...state,
        data: addKey(state.data, action.requestKey, action.data),
      };
    },
    success: (state, action, __data) => {
      // const { [action.requestKey]: removed, ...rest } = state.data;
      const removed = state.data.get(action.requestKey);

      return {
        ...state,
        data: replaceKey(state.data, action.requestKey, action.result),
      };
    },
    failure: (state, action, __data) => {
      // const { [action.requestKey]: removed, ...rest } = state.data;
      return {
        ...state,
        // data: rest,
      };
    },
  });

  const DELETE = handleMethod('DELETE', {
    pending: (state, action) => {
      console.log(action.data);
      console.log(typeof action.data.id, typeof Object.keys(state.data)[0]);

      // const { [action.data.id]: removed, ...rest } = state.data;
      const removed = state.data.get(action.data.id);
      state.data.delete(action.data.id);

      // const rest = Object.keys(state.data).reduce((acc, key) => {
      //   const k = Number(key);
      //   if (k === action.data.id) {
      //     console.log('FOUND THE DAMN KEY');
      //     return acc;
      //   }
      //   return {
      //     ...acc,
      //     [k]: state.data[key],
      //   };
      // }, {});
      return {
        ...state,
        data: new Map(state.data),
      };
    },
    success: (state, action, __data) => state,
    failure: (state, action, __data) => {
      return {
        ...state,
        data: replaceKey(state.data, __data.id, __data),
      };
    },
  });

  function reducer(state = initial, action = {}) {
    if (!startsWith(action.type, `@${name}`)) {
      return state;
    }
    console.log(action.type);
    if (startsWith(action.type, `@${name}/LIST`)) {
      return LIST(state, action);
    }
    if (startsWith(action.type, `@${name}/CREATE`)) {
      return CREATE(state, action);
    }
    if (startsWith(action.type, `@${name}/DELETE`)) {
      return DELETE(state, action);
    }
    console.log('fallthrough');
    return state;
  }

  return {
    reducer,
    list: data => (getState, dispatch) => {
      const requestKey = rando();
      dispatch({
        type: `@${name}/LIST/PENDING`,
        requestKey,
      });
      client
        .get(`http://localhost:3001/api/things`)
        .then(res =>
          dispatch({
            type: `@${name}/LIST/SUCCESS`,
            result: res,
            requestKey,
          })
        )
        .catch(err =>
          dispatch({
            type: `@${name}/LIST/FAILURE`,
            error: err,
            requestKey,
          })
        );
    },
    create: data => (getState, dispatch) => {
      const requestKey = rando();
      dispatch({
        type: `@${name}/CREATE/PENDING`,
        requestKey,
        data,
      });
      client.post(`http://localhost:3001/api/things`, data).then(
        result =>
          dispatch({
            type: `@${name}/CREATE/SUCCESS`,
            data,
            requestKey,
            result,
          }),
        error =>
          dispatch({
            type: `@${name}/CREATE/FAILURE`,
            data,
            requestKey,
            error,
          })
      );
    },
    del: data => (getState, dispatch) => {
      const requestKey = rando();
      dispatch({
        type: `@${name}/DELETE/PENDING`,
        data,
        requestKey,
      });
      client.del(`http://localhost:3001/api/things/${data.id}`, data).then(
        result =>
          dispatch({
            type: `@${name}/DELETE/SUCCESS`,
            data,
            requestKey,
            result,
          }),
        error =>
          dispatch({
            type: `@${name}/DELETE/FAILURE`,
            data,
            requestKey,
            error,
          })
      );
    },
  };
}

// const noop = () => {};
// const methods = {
//   LIST: noop,
//   CREATE: noop,
//   READ: noop,
//   UPDATE: noop,
//   DELETE: noop,
// };

// const methods = ['LIST', 'CREATE', 'READ', 'UPDATE', 'DELETE'];

function createKeys(name, action) {
  return ['pending', 'success', 'error'].map(status => `@${name}/${action}/${status}`);
}

// const removeArrayKey = arr => key => arr.filter(item => item !== key);

export function promiseMiddleware(client) {
  return ({ dispatch, getState }) => {
    return next => action => {
      if (typeof action === 'function') {
        console.log('thunk');
        return action(getState, dispatch);
      }

      return next(action);

      // const { promise, types, ...rest } = action;

      // if (!promise) {
      //   return next(action);
      // }

      // const [REQUEST, SUCCESS, FAILURE] = types;

      // const requestKey = Symbol(rando());
      // // Set the `request` state to be active (e.g. pending)
      // // const newAction = { ...rest, requestKey, type: REQUEST };
      // // console.log('dispatching new action', newAction);
      // // dispatch(newAction);
      // // next({ ...rest, requestKey, type: REQUEST });
      // dispatch({ ...rest, requestKey, type: REQUEST });

      // return (
      //   promise(client)
      //     .then(
      //       // Success means that we call the success action
      //       result => next({ ...rest, requestKey, result, type: SUCCESS }),
      //       // Failure means that we call the error action
      //       error => next({ ...rest, requestKey, error, type: FAILURE })
      //     )
      //     // Something else went wrong, so we catch the error, print it, and call the failure action
      //     .catch(error => {
      //       console.error('Promise Client Error:', error);
      //       next({ ...rest, requestKey, error, type: FAILURE });
      //     })
      // );
    };
  };
}

const listMerge = (state, result) => {
  return {
    ...state,
    data: {
      ...state.data,
      ...result.reduce((acc, item) => {
        return {
          ...acc,
          [item.id]: item,
        };
      }, {}),
    },
  };
};

export function createReducerOLD(name, urlMap) {
  const { LIST, CREATE, READ, UPDATE, DELETE } = methods.reduce(
    (acc, method) => ({ ...acc, [method]: createKeys(name, method) }),
    {}
  );

  const cache = new Map();

  return {
    reducer: (state = initial, action = {}) => {
      const { type, result, requestKey, error } = action;

      if (type.slice(0, name.length + 1) !== `@${name}`) {
        // The action was not meant for this reducer.
        return state;
      }

      console.log(type);

      // We're going to avoid the swtich statement because we need to create some variables and functions
      // in order to make this work correctly
      if (type.includes('/LIST/')) {
        const [PENDING, SUCCESS, FAILURE] = LIST;

        if (type === PENDING) {
          return state;
        }

        if (type === SUCCESS) {
          // We will merge in list types by assuming each resource has an ID, and that the state is an
          // object with ids as keys with the record attached. Also, we assume that the result is an
          // array that we can reduce
          return listMerge(state, result);
        }

        if (type === FAILURE) {
          // nothing to undo
          return state;
        }

        return state;
      }

      if (type.includes('/CREATE/')) {
        const [PENDING, SUCCESS, FAILURE] = CREATE;

        if (type === PENDING) {
          console.log('IN CREATE PENDING', requestKey, action.data);
          console.log({ [requestKey]: { id: requestKey, ...action.data } });

          cache.set(requestKey, action.data);
          // merge here
          const newState = {
            ...state,
            data: {
              ...state.data,
              [requestKey]: { id: requestKey, ...action.data },
            },
          };
          console.log(state === newState);
          return newState;
        }

        if (type === SUCCESS) {
          const { [requestKey]: old, ...data } = state.data;
          cache.delete(requestKey);
          // change the key. we were using a temporary id for the record, but now we have a real
          // id, so we'll just replace the record.
          const newState = {
            ...state,
            data: {
              ...data,
              [result.id]: result,
            },
          };

          return newState;
        }

        if (type === FAILURE) {
          const { [requestKey]: old, ...data } = state.data;
          cache.delete(requestKey);
          // rollback
          return {
            ...state,
            data,
          };
        }

        return state;
      }

      if (type.includes('/READ/')) {
        const [PENDING, SUCCESS, FAILURE] = READ;
        if (type === PENDING) {
          // Cannot merge here
          return {
            ...state,
          };
        }

        if (type === SUCCESS) {
          // merge here
          cache.delete(requestKey);
          return {
            ...state,
          };
        }

        if (type === FAILURE) {
          // Minimal error handling
          cache.delete(requestKey);
          return {
            ...state,
          };
        }

        return state;
      }

      if (type.includes('/UPDATE/')) {
        const [PENDING, SUCCESS, FAILURE] = UPDATE;

        if (type === PENDING) {
          // merge here
          return {
            ...state,
          };
        }

        if (type === SUCCESS) {
          // change the key
          cache.delete(requestKey);
          return {
            ...state,
          };
        }

        if (type === FAILURE) {
          // rollback
          const old = cache.get(requestKey);
          return {
            ...state,
            data: {
              ...state.data,
              [old.id]: old,
            },
          };
        }

        return state;
      }

      if (type.includes('/DELETE/')) {
        const [PENDING, SUCCESS, FAILURE] = DELETE;

        if (type === PENDING) {
          const { [action.data.id]: removed, ...rest } = state.data;
          console.log('IN REMOVED removed', removed, rest);
          // merge here
          cache.set(requestKey, { [action.data.id]: removed });
          return {
            ...state,
            data: {
              ...rest,
            },
          };
        }

        if (type === SUCCESS) {
          // Clear the cache
          cache.delete(requestKey);

          return state;
        }

        if (type === FAILURE) {
          // rollback
          const old = cache.get(requestKey);
          cache.delete(requestKey);

          return {
            ...state,
            data: {
              ...state.data,
              [old.id]: old,
            },
          };
        }

        return state;
      }

      // Probably initializing things.
      return state;
    },
    // Cannot optimistically update
    list: () => ({
      types: LIST,
      promise: client => client.get(urlMap.LIST()),
    }),
    // Can optimisitically update
    create: data => ({
      types: CREATE,
      promise: client => client.post(urlMap.CREATE(data), data),
      data,
    }),
    // Cannot optimistically update
    read: data => ({
      types: READ,
      promise: client => client.get(urlMap.READ(data)),
    }),
    // Can optimisitically update
    update: data => ({
      types: UPDATE,
      promise: client => client.put(urlMap.UPDATE(data), data),
      data,
    }),
    // Can optimistically update
    del: data => ({
      types: DELETE,
      promise: client => client.del(urlMap.DELETE(data)),
      data,
    }),
  };
}
