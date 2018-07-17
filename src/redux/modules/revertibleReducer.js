/**
 * Reducer factory that creates a duck for handling CRUD updates on a single resource
 */

// Grab some sort of API client to use
import { client } from '../../client';

/**
 * startsWith
 * Just determines if one string starts with another string
 */
const startsWith = (haystack, needle) => haystack.indexOf(needle) === 0;

/**
 * rando
 * Creates a random string to be used for request keys and temporary ids
 */
const rando = () => Math.random().toString(36);

/**
 * makeKeys
 * Creates an array of keys for the status namespaced for a method
 */
const makeKeys = (name, method) =>
  ['PENDING', 'SUCCESS', 'FAILURE'].map(status => `@${name}/${method}/${status}`);

/**
 * mergeListIntoData
 * Reduces an array of records into the current data store, overwting anything with id clashes
 */
const mergeListIntoData = (data, result) => ({
  ...data,
  ...result.reduce(
    (acc, item) => ({
      ...acc,
      [item.id]: item,
    }),
    {}
  ),
});

/**
 * addRecordWithTmpId
 * Uses a foreign id for a record and adds the record to the store, it is used
 * to add a record on create when we do not yet have a canonical id for it.
 */
const addRecordWithTmpId = (data, id, record) => ({
  ...data,
  [id]: { id, ...record },
});

/**
 * addRecord
 * Adds a record into the data store using the `id` key in the record itself as the key
 * in the store
 */
const addRecord = (data, record) => ({
  ...data,
  [record.id]: record,
});

/**
 * replaceRecord
 * Swaps a record with one id for another one (and changes the id). This is used to
 *   * update the record after a CREATE has been successful (so we can have a real ID),
 *   * revert a failed UPDATE
 */
const replaceRecord = (data, key, record) => addRecord(removeRecord(data, key), record);

/**
 * removeRecord
 * removes a record from the data store
 */
const removeRecord = (data, key) => {
  // I'm not a fan of using delete here, but destructing turns numbers into strings, and so we cannot
  // find the actual key.
  delete data[key];
  return Object.assign({}, data);
};

/**
 * defaultMethodMap
 * This is overrideable by passing an identically keyed object to the createReducer function. It
 * serves to map with method on the api client each type of action should make
 */
const defaultMethodMap = {
  LIST: 'get',
  CREATE: 'post',
  READ: 'get',
  UPDATE: 'put',
  DELETE: 'del',
};

// Right now, the initial state is not editable. So, you can keep track of only pending requests,
// and the data is automatically imported
const initialState = {
  pending: 0,
  data: {},
};

/**
 * createReducer
 * This creates a reducer and all the actions associated with using it.
 */
export function createReducer(name, urlMap, methodMap = defaultMethodMap) {
  // We're going to use this cache to store request information while requests are processing
  const cache = new Map();
  // methods are configurable. see default above.
  const getMethod = m => methodMap[m.toUpperCase()];

  // This creates subreducers to handle the redux actions generated in the request lifecycle
  // of a request
  const handleMethod = (method, { pending, success, failure }) => {
    // Get the full action names for this namespace and this method
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

  /**
   * These objects control how the state should be manipulated for each state of the request. Each
   * differs slightly.
   *
   * Optimisitic updates can be applied to methods that change data (CREATE, UPDATE, DELETE) but not
   * to methods that just READ / LIST data.
   *
   */

  const LIST = handleMethod('LIST', {
    pending: (state, action) => ({
      pending: state.pending + 1,
      data: state.data,
    }),
    success: (state, action, __data) => ({
      pending: state.pending - 1,
      data: mergeListIntoData(state.data, action.result),
    }),
    failure: (state, action, __data) => ({
      pending: state.pending - 1,
      data: state.data,
    }),
  });

  const CREATE = handleMethod('CREATE', {
    pending: (state, action) => ({
      pending: state.pending + 1,
      data: addRecordWithTmpId(state.data, action.requestKey, action.data),
    }),
    success: (state, action, __data) => ({
      pending: state.pending - 1,
      data: replaceRecord(state.data, action.requestKey, action.result),
    }),
    failure: (state, action, __data) => ({
      pending: state.pending - 1,
      data: removeRecord(state.data, action.requestKey),
    }),
  });

  const READ = handleMethod('READ', {
    pending: (state, action) => ({
      pending: state.pending + 1,
      data: state.data,
    }),
    success: (state, action, __data) => ({
      pending: state.pending - 1,
      data: addRecord(state.data, action.result),
    }),
    failure: (state, action, __data) => ({
      pending: state.pending - 1,
      data: state.data,
    }),
  });

  const UPDATE = handleMethod('UPDATE', {
    pending: (state, action) => ({
      pending: state.pending + 1,
      data: replaceRecord(state.data, action.data.id, action.data),
    }),
    success: (state, action, __data) => ({
      pending: state.pending - 1,
      data: replaceRecord(state.data, action.data.id, action.result),
    }),
    failure: (state, action, __data) => ({
      pending: state.pending - 1,
      data: replaceRecord(state.data, action.data.id, __data),
    }),
  });

  const DELETE = handleMethod('DELETE', {
    pending: (state, action) => ({
      pending: state.pending + 1,
      data: removeRecord(state.data, action.data.id),
    }),
    success: (state, action, __data) => ({
      pending: state.pending - 1,
      data: state.data,
    }),
    failure: (state, action, __data) => ({
      pending: state.pending - 1,
      data: addRecord(state.data, __data),
    }),
  });

  const reducerMap = {
    LIST,
    CREATE,
    READ,
    UPDATE,
    DELETE,
  };

  /**
   * Reducer function that gets supplied to redux
   */
  function reducer(state = initialState, action = {}) {
    // Ensure that this is meant for this reducer
    if (!startsWith(action.type, `@${name}`)) {
      // If not, just return the state
      return state;
    }
    // Pull out the method from the action type, and then call it appropriately. If there is no
    // registered action type, then it's probably the initial setup, so we just return the state.
    const [, METHOD] = action.type.split('/');
    return reducerMap[METHOD] ? reducerMap[METHOD](state, action) : state;
  }

  /**
   * Simplified and abstracted request handling.
   *
   * We treat
   */
  const handleRequest = method => data => (_, dispatch) => {
    // Generate a random request key that will be added to each method so we can undo the correct
    // action is necessary
    const requestKey = rando();
    // Get the action names for this namespace and method
    const [PENDING, SUCCESS, FAILURE] = makeKeys(name, method);
    // Urls differ between methods and might include the resource id or something else, so we
    // just expect a map with functions that take a single argument that will give us the url
    // to ping
    const url = urlMap[method.toLowerCase()](data);

    // For readability, we're extracting out the success function for the resolved promise
    const success = result => {
      // dispatch the success action to update the store
      dispatch({
        type: SUCCESS,
        result, // this is what the API returned
        requestKey,
        data, // this is the original data
      });

      // Return with a resolve so that the actionCreator is thenable
      return Promise.resolve(result);
    };

    // For readability, we're extracting out the failure function for the rejected promise
    // note: if using something like fetch, the client will need to reject on errors to make this
    //       pattern work
    const fail = error => {
      dispatch({
        type: FAILURE,
        error, // this is the error that the API returns
        requestKey,
        data,
      });

      // Return with a reject with the error so that the actionCreator is catchable
      return Promise.reject(error);
    };

    // Send the initial pending action
    dispatch({
      type: PENDING,
      requestKey,
      data,
    });

    // Execute the API call, and return it so more error handling can be put into the components
    // that use this
    return client[getMethod(method)](url, data).then(success, fail);
  };

  // These are the created functions that should be re-exported by the consumer of this factory
  return {
    // Put this into your root reducer
    reducer,
    // Call a LIST route
    list: handleRequest('LIST'),
    // Create a resource
    create: handleRequest('CREATE'),
    // Read a single resource
    read: handleRequest('READ'),
    // Update a resource
    update: handleRequest('UPDATE'),
    // Delete a resource. (note: delete is a reserved word, so this is named del in an effort to
    // make it usable with destructuring)
    del: handleRequest('DELETE'),
  };
}

// This is a crappy version of redux-thunk. This factory relies on thunks, so make sure that
// something like it is included in the middleware
export const promiseMiddleware = client => ({ dispatch, getState }) => next => action =>
  typeof action === 'function' ? action(getState, dispatch) : next(action);
