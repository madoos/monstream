const { Transform, Readable } = require('readable-stream');

// map :: (a -> b) -> Transform b
const map = f =>
  new Transform({
    objectMode : true,
    transform(x, _, next) {
      try {
        next(null, f(x));
      } catch (e) {
        next(e);
      }
    }
  });

// createReadableOf :: a -> ReadableStream a
const createReadableOf = value => {
  const stream = new Readable({ objectMode : true, read() {} });
  stream.push(value);
  stream.push(null);
  return stream;
};

// createReadableFrom :: Iterable i => i -> ReadableStream i
const createReadableFrom = values => {
  const stream = new Readable({ objectMode : true, read() {} });

  for (let item of values) {
    stream.push(item);
  }
  stream.push(null);
  return stream;
};

module.exports = {
  map,
  createReadableOf,
  createReadableFrom
};
