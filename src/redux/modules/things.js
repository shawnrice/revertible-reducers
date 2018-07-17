/**
 * Example use of the revertible reducer factory
 */
import { createReducer } from './revertibleReducer';

// So, we name this the THING reducer, and we call it with the name and the urlMap, destructuring
// the reducer as well as the actions
const { reducer, list, create, read, update, del } = createReducer('THING', {
  // List is static
  list: () => '/api/things',
  // Create is static
  create: () => '/api/things',
  // Reads a particular resource found at {id}
  read: data => `/api/things/${data.id}`,
  // Updates a particular resource found at {id}
  update: data => `/api/things/${data.id}`,
  // Deletes a particular resource found at {id}
  delete: data => `/api/things/${data.id}`,
});

// Re-export the reducer and the actions so that they can be consumed
export default reducer;
export { reducer, list, create, read, update, del };
