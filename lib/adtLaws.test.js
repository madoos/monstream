const FL = require('fantasy-land');
const equals = require('deep-equal');
const { createReadableFrom, createReadableOf } = require('./transform');
const { collect } = require('./util');
const { apply, inc, multiply, identity, pipe, o } = require('ramda');
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

  describe('Apply specification laws (.ap)', () => {
    test('Apply specification must implement the Functor specification', () => {
      const src = Monstream(() => createReadableFrom([1, 2, 3]));
      expect(src[FL.map]).toBeInstanceOf(Function);
      expect(src.map).toBeInstanceOf(Function);
    });

    test('composition "x.ap(g.ap(f.map(compose))) === x.ap(g).ap(f)"', done => {
      const src = Monstream(() => createReadableOf(1));
      const f = Monstream(() => createReadableOf(inc));
      const g = Monstream(() => createReadableOf(multiply(10)));
      const x = src.ap(g.ap(f.map(o)));
      const y = src.ap(g).ap(f);

      x.forEach(xVal => {
        // eslint-disable-next-line max-nested-callbacks
        y.forEach(yVal => {
          expect(xVal).toEqual(yVal);
          done();
        });
      });
    });
  });
});
