const { map, ap, lift, inc } = require('ramda');
const { createReadableFrom, createReadableOf } = require('./transform');
const { noop, collect } = require('./util');
const { Writable, Readable, Transform } = require('readable-stream');
const Monstream = require('./Monstream');
const monstream = require('./');

describe('Monstream', () => {
  describe('.forEach', () => {
    test('Should consume each value by function', done => {
      const results = [];
      const stream = new Monstream(() => createReadableFrom(['a', 'b', 'c']));

      stream.forEach(val => results.push(val), noop, () => {
        expect(results).toEqual(['a', 'b', 'c']);
        done();
      });
    });

    test('Should consume each value by writable stream', done => {
      const results = [];
      const stream = new Monstream(() => createReadableFrom(['a', 'b', 'c']));

      const writable = new Writable({
        objectMode : true,
        write(val, _, next) {
          results.push(val);
          next();
        }
      });

      stream.forEach(writable, noop, () => {
        expect(results).toEqual(['a', 'b', 'c']);
        done();
      });
    });

    test('Should handle readable errors', done => {
      const errorMsg = 'readable error';
      const stream = new Monstream(() => {
        return new Readable({
          read() {
            process.nextTick(() => this.emit('error', new Error(errorMsg)));
          }
        });
      });

      stream.forEach(noop, error => {
        expect(error.message).toEqual(errorMsg);
        done();
      });
    });

    test('Should handle writable errors', done => {
      const errorMsg = 'writable error';
      const stream = new Monstream(() => createReadableFrom(['a', 'b', 'c']));

      const writable = new Writable({
        objectMode : true,
        write() {
          process.nextTick(() => this.emit('error', new Error(errorMsg)));
        }
      });

      stream.forEach(writable, error => {
        expect(error.message).toEqual(errorMsg);
        done();
      });
    });
  });

  describe('.join', () => {
    test('Should flatten stream of streams', () => {
      const streamOfStreams = new Monstream(() => {
        return createReadableFrom([
          new Monstream(() => createReadableFrom([1, 2, 3])),
          new Monstream(() => createReadableFrom([4, 5, 6])),
          new Monstream(() => createReadableFrom([[7], [8]]))
        ]);
      });

      return collect(streamOfStreams.join()).then(results =>
        expect(results).toEqual([1, 2, 3, 4, 5, 6, [7], [8]])
      );
    });

    test('Should notify end of flatten values', done => {
      const streamOfStreams = new Monstream(() => {
        return createReadableFrom([
          new Monstream(() => createReadableFrom([1, 2, 3])),
          new Monstream(() => createReadableFrom([4, 5, 6])),
          new Monstream(() => createReadableFrom([[7], [8]]))
        ]);
      });

      streamOfStreams.join().forEach(noop, noop, done);
    });

    test('Should handle errors', () => {
      const errorMsg = 'join error';
      const streamOfStreams = new Monstream(() => {
        return createReadableFrom([
          new Monstream(() => createReadableFrom([1, 2, 3])).map(() => {
            throw new Error(errorMsg);
          })
        ]);
      });

      return collect(streamOfStreams.join()).catch(e =>
        expect(e.message).toEqual(errorMsg)
      );
    });
  });

  describe('.map', () => {
    const toUpper = s => s.toUpperCase();

    const toUpperTransform = () =>
      new Transform({
        objectMode : true,
        transform(s, _, next) {
          next(null, toUpper(s));
        }
      });

    test('Should apply functions for each value of stream', () => {
      const letters = new Monstream(() =>
        createReadableFrom(['a', 'b', 'c', 'd'])
      );
      return collect(letters.map(toUpper)).then(results =>
        expect(results).toEqual(['A', 'B', 'C', 'D'])
      );
    });

    test('Should to have fantasy land interoperability', () => {
      const letters = monstream(() => createReadableFrom(['a', 'b', 'c', 'd']));
      return collect(map(toUpper)(letters)).then(results =>
        expect(results).toEqual(['A', 'B', 'C', 'D'])
      );
    });

    test('Should handle errors in function', () => {
      const ErrorMsg = 'error in .map method';
      const numbers = new Monstream(() => createReadableFrom([1, 2, 3]));
      return collect(
        numbers.map(() => {
          throw new Error(ErrorMsg);
        })
      ).catch(e => expect(e.message).toEqual(ErrorMsg));
    });

    test('Should apply transform for each value of stream', () => {
      const letters = new Monstream(() =>
        createReadableFrom(['a', 'b', 'c', 'd'])
      );
      return collect(letters.map(toUpperTransform())).then(results =>
        expect(results).toEqual(['A', 'B', 'C', 'D'])
      );
    });

    test('Should to have fantasy land interoperability with transforms', () => {
      const letters = new Monstream(() =>
        createReadableFrom(['a', 'b', 'c', 'd'])
      );
      const uppers = map(toUpperTransform(), letters);
      return collect(uppers).then(result =>
        expect(result).toEqual(['A', 'B', 'C', 'D'])
      );
    });

    test('Should handle errors in transform', () => {
      const ErrorMsg = 'error in .map method';
      const numbers = new Monstream(() => createReadableFrom([1, 2, 3]));
      const errorTransform = new Transform({
        objectMode : true,
        transform(_, __, next) {
          next(new Error(ErrorMsg));
        }
      });

      return collect(numbers.map(errorTransform)).catch(e =>
        expect(e.message).toEqual(ErrorMsg)
      );
    });
  });

  describe('.ap', () => {
    test('Should lift a function in a functor context and apply to another of same type functor', () => {
      const plus = new Monstream(() => createReadableOf(n => n + 1));
      const one = new Monstream(() => createReadableOf(1));

      return collect(one.ap(plus)).then(([result]) =>
        expect(result).toEqual(2)
      );
    });

    test('Should to have fantasy land interoperability', () => {
      const one = monstream(() => createReadableOf(1));
      const plus = monstream(() => createReadableOf(inc));
      const two = ap(plus)(one);
      return collect(two).then(([result]) => expect(result).toEqual(2));
    });

    test('Should lift function using fantasy land interoperability', () => {
      const one = monstream(() => createReadableOf(1));
      const two = monstream(() => createReadableOf(2));
      const addS = lift(x => y => x + y);

      return collect(addS(one, two)).then(([result]) =>
        expect(result).toEqual(3)
      );
    });
  });

  describe('static .of', () => {
    test('Should lift a value into functor context', () => {
      const one = Monstream.of(1);

      return collect(one).then(([result]) => expect(result).toEqual(1));
    });
  });
});
