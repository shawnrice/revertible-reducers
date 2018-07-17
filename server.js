const jsonServer = require('json-server');
const path = require('path');
const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults();

server.use(middlewares);

server.use(
  jsonServer.rewriter({
    '/api/*': '/$1',
  })
);

const randomFail = (req, res, next) => {
  if (Math.floor(Math.random() * 100) < 10) {
    res.sendStatus(400);
  } else {
    next();
  }
};

const delay = (req, res, next) => {
  const sleep = Math.floor(Math.random() * 2000);
  setTimeout(next, sleep);
};

server.use(delay);
server.use(randomFail);

server.use(router);
server.listen(3001, () => {
  console.log('JSON Server is running');
});
