import { createReducer } from './revertableReducer';

const { reducer, list, create, read, update, del } = createReducer(
  'THING',
  {
    LIST: () => '/api/things',
    CREATE: data => '/api/things',
    READ: data => `/api/things/${data.id}`,
    UPDATE: data => `/api/things/${data.id}`,
    DELETE: data => `/api/things/${data.id}`,
  },
  {
    pending: false,
    error: false,
    data: {},
  }
);

export default reducer;
export { reducer, list, create, read, update, del };
