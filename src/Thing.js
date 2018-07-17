import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { list, create, read, update, del } from './redux/modules/things';

class Thing extends PureComponent {
  componentDidMount() {
    this.props.list();
  }

  add = () => {
    this.props.create({ name: Math.random().toString(36) });
  };

  del = id => {
    this.props.del({ id });
  };

  renderThing = data => {
    return (
      <tr key={data.id}>
        <td>
          <button onClick={() => this.del(data.id)}>x</button>
        </td>
        {Object.keys(data).map(key => <td key={key}>{data[key]}</td>)}
      </tr>
    );
  };
  render() {
    return (
      <div className={this.props.className}>
        <h2>Things!</h2>
        <table>
          <tbody>
            {Object.keys(this.props.data).map(id => this.renderThing(this.props.data[id]))}
          </tbody>
        </table>
        <button onClick={this.add}>Add</button>
      </div>
    );
  }
}

export default connect(
  state => ({
    data: state.things.data || {},
  }),
  { list, create, read, update, del }
)(Thing);
