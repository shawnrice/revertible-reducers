import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { list, create, read, update, del } from './redux/modules/things';

class Input extends PureComponent {
  state = {
    value: this.props.value || '',
  };
  onBlur = event => {
    this.props.onBlur(this.state.value);
  };

  onChange = event => {
    const { value } = event.target;
    this.setState({ value });
  };
  render() {
    const { name = '' } = this.props;
    const { value } = this.state;
    return (
      <input type="text" name={name} value={value} onChange={this.onChange} onBlur={this.onBlur} />
    );
  }
}

class Thing extends PureComponent {
  componentDidMount() {
    this.loadAll();
  }

  loadAll = () => {
    this.props.list().catch(() => {
      console.error('Listing failed. Retrying to load in 100ms');
      setTimeout(this.loadAll, 100);
    });
  };

  add = () => {
    const name = Math.random().toString(36);
    this.props
      .create({ name })
      .then(res => {
        console.log('Successfully created resource with name', name);
        console.log('Received response:', res);
      })
      .catch(err => {
        console.error('Error creating resource with name', name);
        console.error('Recevied error:', err);
      });
  };

  del = id => {
    this.props
      .del({ id })
      .then(res => {
        console.log('Successfully deleted resource with id', id);
        console.log('Received response:', res);
      })
      .catch(err => {
        console.error('Error deleting resource with id', id);
        console.error('Recevied error:', err);
      });
  };

  update = data => {
    this.props
      .update(data)
      .then(res => {
        console.log('Successfully updated resource with id', data.id);
        console.log('Received response:', res);
      })
      .catch(err => {
        console.error('Error updating resource with id', data.id);
        console.error('Received error:', err);
      });
  };

  renderThing = data => {
    return (
      <tr key={data.id}>
        <td>
          <button onClick={() => this.del(data.id)} className="delete-button">
            x
          </button>
        </td>
        <td>{data.id}</td>
        <td>
          <Input
            name={'a' + data.id}
            value={data.name}
            onBlur={name => this.update({ id: data.id, name })}
          />
        </td>
      </tr>
    );
  };
  render() {
    return (
      <div className={this.props.className}>
        <h2>Things!</h2>
        <h3>Pending requests: {this.props.pending}</h3>
        <button onClick={this.add} className="add-button">
          Add
        </button>
        <table>
          <tbody>
            {Object.keys(this.props.data).map(id => this.renderThing(this.props.data[id]))}
          </tbody>
        </table>
      </div>
    );
  }
}

export default connect(
  state => ({
    pending: state.things.pending,
    data: state.things.data || {},
  }),
  { list, create, read, update, del }
)(Thing);
