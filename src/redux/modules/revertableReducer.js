import { client } from '../../client';

const startsWith = (haystack, needle) => haystack.indexOf(needle) === 0;
const rando = () => Math.random().toString(36);

const makeKeys = (name, method) =>
  ['PENDING', 'SUCCESS', 'FAILURE'].map(status => `@${name}/${method}/${status}`);

const listMerge = (data, result) => ({
  ...data,
  ...result.reduce(
    (acc, item) => ({
      ...acc,
      [item.id]: item,
    }),
    {}
  ),
});

const addTmpID = (data, id, record) => ({
  ...data,
  [id]: { id, ...record },
});

const addKey = (data, record) => ({
  ...data,
  [record.id]: record,
});

const replaceKey = (data, key, record) => addKey(removeKey(data, key), record);

const removeKey = (data, key) => {
  // I'm not a fan of using delete here, but destructing turns numbers into strings, and so we cannot
  // find the actual key.
  delete data[key];
  return Object.assign({}, data);
};

const defaultMethodMap = {
  LIST: 'get',
  CREATE: 'post',
  READ: 'get',
  UPDATE: 'put',
  DELETE: 'del',
};
const defaultInitial = {
  pending: false,
  error: false,
  data: {},
};

export function createReducer(
  name,
  urlMap,
  methodMap = defaultMethodMap,
  initial = defaultInitial
) {
  // We're going to use this cache to store request information while requests are processing
  const cache = new Map();
  // methods are configurable. see default above.
  const getMethod = m => methodMap[m.toUpperCase()];

  // This creates subreducers to handle the redux actions generated in the request lifecycle
  // of a request
  const handleMethod = (method, { pending, success, failure }) => {
    const [PENDING, SUCCESS, FAILURE] = makeKeys(name, method);

    // Since we need to create variables to pull data, we need the if statements rather than the
    // standard switch because we can't declare consts in a switch scope
    return function subreducer(state, action) {
      if (action.type === PENDING) {
        const data = method === 'DELETE' ? state.data[action.data.id] : action.data;
        cache.set(action.requestKey, data);
        return pending(state, action);
      }

      if (action.type === SUCCESS) {
        const __data = cache.get(action.requestKey);
        cache.delete(action.requestKey);
        return success(state, action, __data);
      }

      if (action.type === FAILURE) {
        const __data = cache.get(action.requestKey);
        cache.delete(action.requestKey);
        return failure(state, action, __data);
      }

      return state;
    };
  };

  const LIST = handleMethod('LIST', {
    pending: (state, action) => state,
    success: (state, action, __data) => ({
      ...state,
      data: listMerge(state.data, action.result),
    }),
    failure: (state, action, __data) => state,
  });

  const CREATE = handleMethod('CREATE', {
    pending: (state, action) => ({
      ...state,
      data: addTmpID(state.data, action.requestKey, action.data),
    }),
    success: (state, action, __data) => ({
      ...state,
      data: replaceKey(state.data, action.requestKey, action.result),
    }),
    failure: (state, action, __data) => ({
      ...state,
      data: removeKey(state.data, action.requestKey),
    }),
  });

  const READ = handleMethod('READ', {
    pending: (state, action) => state,
    success: (state, action, __data) => ({
      ...state,
      data: addKey(state.data, action.result),
    }),
    failure: (state, action, __data) => state,
  });

  const UPDATE = handleMethod('UPDATE', {
    pending: (state, action) => ({
      ...state,
      data: replaceKey(state.data, action.data.id, action.data),
    }),
    success: (state, action, __data) => state,
    failure: (state, action, __data) => ({
      ...state,
      data: replaceKey(state.data, action.data.id, __data),
    }),
  });

  const DELETE = handleMethod('DELETE', {
    pending: (state, action) => {
      return {
        ...state,
        data: removeKey(state.data, action.data.id),
      };
    },
    success: (state, action, __data) => state,
    failure: (state, action, __data) => {
      return {
        ...state,
        data: {
          ...state.data,
          [__data.id]: __data,
        },
      };
    },
  });

  const reducerMap = {
    LIST,
    CREATE,
    READ,
    UPDATE,
    DELETE,
  };

  function reducer(state = initial, action = {}) {
    if (!startsWith(action.type, `@${name}`)) {
      return state;
    }
    const [, METHOD] = action.type.split('/');
    return reducerMap[METHOD] ? reducerMap[METHOD](state, action) : state;
  }

  const handleRequest = method => data => (_, dispatch) => {
    const requestKey = rando();
    const [PENDING, SUCCESS, FAILURE] = makeKeys(name, method);
    const url = urlMap[method.toLowerCase()](data);

    const success = result =>
      dispatch({
        type: SUCCESS,
        result,
        requestKey,
        data,
      });

    const fail = error =>
      dispatch({
        type: FAILURE,
        error,
        requestKey,
        data,
      });

    dispatch({
      type: PENDING,
      requestKey,
      data,
    });

    client[getMethod(method)](url, data)
      .then(success, fail)
      .catch(fail);
  };

  return {
    reducer,
    list: handleRequest('LIST'),
    create: handleRequest('CREATE'),
    read: handleRequest('READ'),
    update: handleRequest('UPDATE'),
    del: handleRequest('DELETE'),
  };
}

export const promiseMiddleware = client => ({ dispatch, getState }) => next => action =>
  typeof action === 'function' ? action(getState, dispatch) : next(action);
