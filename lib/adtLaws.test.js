const equals = require('deep-equal');
const { createReadableFrom } = require('./transform');
const { collect } = require('./util');
const { apply, inc, multiply, identity, pipe } = require('ramda');
const isEquivalent = (x, y) =>
  Promise.all([collect(x), collect(y)]).then(apply(equals));

const Monstream = require('./');

describe('ADTs laws', () => {
  describe('Functor laws (.map)', () => {
    test('identity "x.map(val => val) === x"', () => {
      const x = Monstream(() => createReadableFrom([1, 2, 3]));
      const y = x.map(identity);
      return isEquivalent(x, y).then(result => expect(result).toEqual(true));
    });

    test('composition "x.map(f).map(g) === x.map(val => g(f(val)))"', () => {
      const src = Monstream(() => createReadableFrom([1, 2, 3]));
      const x = src.map(inc).map(multiply(10));
      const y = src.map(
        pipe(
          inc,
          multiply(10)
        )
      );
      return isEquivalent(x, y).then(result => expect(result).toEqual(true));
    });
  });
});
