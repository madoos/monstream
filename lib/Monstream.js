const { map } = require('./transform');
const { isFunction, noop } = require('./util');

class Monstream {
  constructor(getStream) {
    this._getStream = getStream;
  }

  map(f) {
    return new Monstream(() => {
      const mapper = isFunction(f) ? map(f) : f;
      return this._getStream().pipe(mapper);
    });
  }

  forEach(next = noop, error = noop, complete = noop) {
    const isConsumedByFunction = isFunction(next);
    const COMPLETED_EVENT = isConsumedByFunction ? 'end' : 'finish';
    const stream = isConsumedByFunction
      ? this._getStream().on('data', next)
      : this._getStream().pipe(next);
    return stream.on('error', error).on(COMPLETED_EVENT, complete);
  }
}

module.exports = Monstream;
