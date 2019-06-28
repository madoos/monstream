const { Readable } = require('readable-stream');
const FL = require('fantasy-land');

const { isFunction, isPromise, noop, collect, construct } = require('./util');

describe('util', () => {
  test('.isFunction', () => {
    expect(isFunction(x => x)).toEqual(true);
    expect(
      isFunction(function(x) {
        return x;
      })
    ).toEqual(true);
    expect(isFunction({})).toEqual(false);
  });

  test('.isPromise', () => {
    expect(isPromise(x => x)).toEqual(false);
    expect(isPromise(Promise.resolve({}))).toEqual(true);
  });

  test('.noop', () => {
    expect(noop()).toEqual(undefined);
  });

  test('.collect', () => {
    const stream = new Readable({ objectMode : true, read() {} });
    stream.push(1);
    stream.push(2);
    stream.push(null);
    return collect(stream).then(results => expect(results).toEqual([1, 2]));
  });

  describe('.construct', () => {
    class Identity {
      constructor(val) {
        this._val = val;
      }

      static add(a, b) {
        return new Identity(a._val + b._val);
      }

      map(f) {
        return new Identity(f(this._val));
      }
    }

    const _Identity = construct(Identity);

    test('Should add fantasy land interoperability', () => {
      expect(_Identity(1)[FL.map]).toBeInstanceOf(Function);
    });

    test('Should avoid new operator use', () => {
      expect(_Identity(1)).toBeInstanceOf(Identity);
    });

    test('Should adds curry for static methods', () => {
      expect(_Identity.add(_Identity(1))(_Identity(2))._val).toEqual(3);
    });
  });
});
