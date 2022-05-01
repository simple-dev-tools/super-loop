const { RateLimiterMemory } = require('rate-limiter-flexible')
const { Transform, Readable } = require('stream')
const { promisify } = require('util')

const sleep = promisify(setTimeout)

class SimpleLoopReadable extends Readable {

  constructor(options) {
    super(options)
    this._suspended = false
    this.endTimestamp = options.endTimestamp || Infinity
    this.maxRepeat = options.maxRepeat || Infinity
    this.messageProducerFunc = options.messageProducerFunc
    this.streamEnderFunc = options.streamEnderFunc
    this.loggingEmitter = options.loggingEmitter
    this.start()
  }

  _read() {
    if (this._suspended) {
      this.resumeStreaming()
    }
  }

  resumeStreaming() {
    this._suspended = false
  }

  pauseStreaming() {
    this._suspended = true
  }

  start() {
    this.counter = 0
    const loop = () => {
      setImmediate(async () => {

        // precheck
        try {
          //console.log('time diff', Date.now() - this.endTimestamp, Date.now() >= this.endTimestamp );
          if (Date.now() >= this.endTimestamp || this.counter >= this.maxRepeat) {
            this.push(null)
            return
          }

          if (this.streamEnderFunc && this.streamEnderFunc()) {
            this.push(null)
            return
          }
        } catch (err) {
          err.message = 'SimpleLoopReadable Precheck Error -- ' + err.message
          this.loggingEmitter.emit('warn', err)
        }

        if (!this._suspended) {
          try {
            // messageProduceFunc should return messages array
            this.counter += 1
            const messages = this.messageProducerFunc ? await this.messageProducerFunc() : [{ index: this.counter }]

            //console.log('producer', messages[0].index);
            for (let i = 0; i < messages.length; i++) {
              const message = messages[i]
              const canContinue = this.push(message)
              // keep pushing until entire array is pushed to downstream
              if (!canContinue && i === messages.length - 1) {
                this.pauseStreaming()
                await sleep(100)
              }
            }

          } catch (err) {
            err.message = 'SimpleLoopReadable Error -- ' + err.message
            this.loggingEmitter.emit('warn', err)
          }
        }
        return loop()
      })
    }
    loop()
  }
}


function StreamThrottler(tps = 10) {
  const rateLimiter = new RateLimiterMemory({
    points: tps,
    duration: 1
  })

  function process(
    self, data, encoding, done
  ) {
    rateLimiter.consume('#super-loop#streaming_util.js#throtter', 1)
      .then(() => done(null, data))
      .catch((e) => {
        if (e.msBeforeNext) {
          setTimeout(() => {
            try {
              process(
                self, data, encoding, done
              )
            } catch (err) {
              err.message = 'StreamThrotter Error -- ' + err.message
              done(err)
            }
          }, e.msBeforeNext)
        } else {
          done(e)
        }
      })
  }

  return new Transform({
    objectMode: true,
    transform(data, encoding, done) {
      process(
        this, data, encoding, done
      )
    }
  })
}

module.exports = {
  StreamThrottler,
  SimpleLoopReadable
}
