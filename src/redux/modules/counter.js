const INCREMENT = '@COUNTER/INCREMENT';
const DECREMENT = '@COUNTER/DECREMENT';

const initial = {
  counter: 0,
};

export default function reducer(state = initial, action = {}) {
  switch (action.type) {
    case INCREMENT:
      return {
        ...state,
        counter: state.counter + 1,
      };
    case DECREMENT:
      return {
        ...state,
        counter: state.counter - 1,
      };
    default:
      return state;
  }
}

export function increment() {
  return {
    type: INCREMENT,
  };
}
export function decrement() {
  return {
    type: DECREMENT,
  };
}
