const noop = () => {};
const methods = {
  LIST: noop,
  CREATE: noop,
  READ: noop,
  UPDATE: noop,
  DELETE: noop,
};

function createKeys(name, action) {
  return ['pending', 'success', 'error'].map(status => `${name}/${action}/${status}`);
}

function createReducer(name, fnMap, initial) {
  // const keys =
  return {
    reducer: (state = initial, action = {}) => {},
    list: () => {
      return type;
    },
  };
}
