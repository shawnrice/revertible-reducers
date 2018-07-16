import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { increment, decrement } from './redux/modules/counter';

class Counter extends PureComponent {
  render() {
    return (
      <div>
        {this.props.counter.counter}
        <div>
          <button onClick={this.props.increment}>+</button>
          <button onClick={this.props.decrement}>-</button>
        </div>
      </div>
    );
  }
}

export default connect(
  ({ counter }) => ({
    counter,
  }),
  { increment, decrement }
)(Counter);
