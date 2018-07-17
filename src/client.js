const toJSON = res => {
  return res.status < 400
    ? Promise.resolve(res.json())
    : Promise.reject(Object.assign({}, { code: res.status }, res.json()));
};

export const client = {
  get: (url, data) => fetch(url).then(toJSON),
  put: (url, data) =>
    fetch(url, {
      method: 'PUT',
      body: JSON.stringify(data), // data can be `string` or {object}!
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(toJSON),
  post: (url, data) =>
    fetch(url, {
      method: 'POST',
      body: JSON.stringify(data), // data can be `string` or {object}!
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(toJSON),
  del: (url, data) =>
    fetch(url, {
      method: 'DELETE',
      body: JSON.stringify(data), // data can be `string` or {object}!
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(toJSON),
};

export default client;
