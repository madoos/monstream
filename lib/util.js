const FL = require('fantasy-land');
const { curry } = require('ramda');

// construct :: (* -> {*}) -> (* → {*})
/*
1- Adds fantasy-land interoperability
2- Adds curry for static methods
*/
const construct = Constructor => {
  const wrappedConstructor = (...args) => new Constructor(...args);

  Object.getOwnPropertyNames(Constructor)
    .filter(prop => typeof Constructor[prop] === 'function')
    .forEach(prop => (wrappedConstructor[prop] = curry(Constructor[prop])));

  Object.getOwnPropertyNames(Constructor.prototype)
    .filter(prop => !['constructor', 'toString'].includes(prop) && FL[prop])
    .forEach(
      prop => (Constructor.prototype[FL[prop]] = Constructor.prototype[prop])
    );

  return wrappedConstructor;
};

// isFunction :: a -> Boolean
const isFunction = x => typeof x === 'function';

// isPromise :: a -> Boolean
const isPromise = x => Object(x).constructor === Promise;

// noop :: () -> void
const noop = () => {};

// collect :: (Stream a| Monstream a) -> Promise e [a]
const collect = stream => {
  const results = [];
  return new Promise((resolve, reject) => {
    const pushResults = val => results.push(val);
    const resolveResults = () => resolve(results);
    stream.forEach
      ? stream.forEach(pushResults, reject, resolveResults)
      : stream
        .on('data', pushResults)
        .on('end', resolveResults)
        .on('error', reject);
  });
};

module.exports = {
  construct,
  isFunction,
  isPromise,
  noop,
  collect
};
