import { client } from '../../client';

const startsWith = (haystack, needle) => haystack.indexOf(needle) === 0;
const rando = () => Math.random().toString(36);

function makeKeys(name, action) {
  return ['PENDING', 'SUCCESS', 'FAILURE'].map(
    status => `@${name}/${action.toUpperCase()}/${status}`
  );
}

function getMethod(method) {
  switch (method.toUpperCase()) {
    case 'CREATE':
      return 'post';
    case 'UPDATE':
      return 'put';
    case 'DELETE':
      return 'del';
    case 'LIST':
    case 'READ':
    default:
      return 'get';
  }
}

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

const addId = (data, record) => ({
  ...data,
  [record.id]: record,
});

const replaceId = (data, id, record) => {
  const { [id]: removed, ...rest } = data;
  return addId(rest, record);
};

const removeId = (data, id) => {
  // I'm not a fan of using delete here, but destructing turns numbers into strings, and so we cannot
  // find the actual id.
  delete data[id];
  return Object.assign({}, data);
};
export function createReducer(name, urlMap, initial) {
  const cache = new Map();

  const handleMethod = (method, { pending, success, failure }) => {
    method = method.toUpperCase();
    const prefix = `@${name}/${method}`;

    return function subreducer(state, action) {
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
      data: replaceId(state.data, action.requestKey, action.result),
    }),
    failure: (state, action, __data) => ({
      ...state,
      data: removeId(state.data, action.requestKey),
    }),
  });

  const READ = handleMethod('READ', {
    pending: (state, action) => state,
    success: (state, action, __data) => ({
      ...state,
      data: addId(state.data, action.result),
    }),
    failure: (state, action, __data) => state,
  });

  const UPDATE = handleMethod('UPDATE', {
    pending: (state, action) => ({
      ...state,
      data: replaceId(state.data, action.data.id, action.data),
    }),
    success: (state, action, __data) => state,
    failure: (state, action, __data) => ({
      ...state,
      data: replaceId(state.data, action.data.id, __data),
    }),
  });

  const DELETE = handleMethod('DELETE', {
    pending: (state, action) => {
      return {
        ...state,
        data: removeId(state.data, action.data.id),
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

  function handleRequest(method) {
    return data => (getState, dispatch) => {
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
  }

  return {
    reducer,
    list: handleRequest('LIST'),
    create: handleRequest('CREATE'),
    read: handleRequest('READ'),
    update: handleRequest('UPDATE'),
    del: handleRequest('DELETE'),
  };
}

// const removeArrayKey = arr => key => arr.filter(item => item !== key);

export const promiseMiddleware = client => ({ dispatch, getState }) => next => action =>
  typeof action === 'function' ? action(getState, dispatch) : next(action);
