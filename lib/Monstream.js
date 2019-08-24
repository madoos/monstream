const { map, createReadable } = require('./transform');
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

  join() {
    return new Monstream(() => {
      const stream = createReadable();
      let isFinished = false;
      let subscriptions = 0;
      let endedSubscriptions = 0;
      const streamOfStreams = this;
      const pushError = e => stream.emit('error', e);

      const pushFlattValues = streamOfValues => {
        subscriptions++;
        streamOfValues.forEach(
          x => {
            stream.push(x);
          },
          pushError,
          () =>
            isFinished &&
            subscriptions === ++endedSubscriptions &&
            stream.push(null)
        );
      };

      streamOfStreams.forEach(
        pushFlattValues,
        pushError,
        () => (isFinished = true)
      );
      return stream;
    });
  }

  ap(functions) {
    return new Monstream(() => {
      return functions
        .map(f => {
          return this.map(f);
        })
        .join()
        ._getStream();
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
