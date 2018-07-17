import { createReducer } from './revertibleReducer';

const { reducer, list, create, read, update, del } = createReducer('THING', {
  list: () => '/api/things',
  create: data => '/api/things',
  read: data => `/api/things/${data.id}`,
  update: data => `/api/things/${data.id}`,
  delete: data => `/api/things/${data.id}`,
});

export default reducer;
export { reducer, list, create, read, update, del };
