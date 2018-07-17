# Revertible Reducers

Example implmentation of revertible CRUD API reducers.

We're not holding a strict undo/redo stack here because there's always the chance that network
requests will return out of order having us undo the wrong store update.

See `src/Thing.js` for an overloaded React component that implments some of the redux actions.

See `src/redux/modules/things.js` for an example of creating the reducers.

See `src/redux/revertibleReducer.js` for the factory that creates the reducers.

Also included is a simple json server that has random errors and random delays to test how things
work in non-ideal scenarios.

This project was bootstrapped with [Create React App](https://github.com/facebookincubator/create-react-app).
