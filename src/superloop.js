const { promisify } = require('util')
const EventEmitter = require('events')
const { pipeline } = require('stream')
const t2c = require('through2-concurrent')

const Streams = require('./streams')

class SuperLoop extends EventEmitter {

  constructor() {
    super()
    this.maxConcurrency = 100
    this.maxTps = 50
    this.maxRepeat = Infinity
    this.endTimestamp = Infinity
    this.producerFunc = null // function should tak no arg, and return Array
    this.consumerFunc = () => { }
    this.enderFunc = () => false // function return true or false
    this.upstream = null
    this.downstream = null
    this.mapperFuncs = []
  }

  consumedBy(func) {
    return this.invoke(func)
  }

  producedBy(func) {
    this.producerFunc = func
    return this
  }

  invoke(func) {
    this.consumerFunc = func
    return this
  }

  endedBy(func) {
    this.enderFunc = func
    return this
  }

  concurrency(maxC) {
    this.maxConcurrency = maxC
    return this
  }

  rate(tps) {
    this.maxTps = tps
    return this
  }

  until(endTime) {
    this.endTimestamp = endTime
    return this
  }

  repeat(times) {
    this.maxRepeat = times
    return this
  }

  pipeFrom(up) {
    this.upstream = up
    return this
  }

  pipeTo(down) {
    this.downstream = down
    return this
  }

  async exec() {
    const _func = this.consumerFunc
    const _loop = this
    let forcePipeStop = false
    
    try {

      if (!this.upstream) {
        this.upstream = new Streams.SimpleLoopReadable({
          objectMode: true,
          maxRepeat: this.maxRepeat,
          endTimestamp: this.endTimestamp,
          messageProducerFunc: this.producerFunc,
          streamEnderFunc: () => this.enderFunc() || forcePipeStop,
          loggingEmitter: _loop
        })
      }

      const streams = [
        this.upstream,
        Streams.StreamThrottler(this.maxTps),
        t2c.obj({
          objectMode: true,
          maxConcurrency: this.maxConcurrency
        }, async function (data, _, cb) {
          try {
            const result = await _func(data)
            if (_loop.downstream) { // only if downstream exists
              this.push(result)
            }
          } catch (err) {
            err.message = 'SuperLoop#exec Error -- ' + err.message
            _loop.emit('warn', err)
          } finally {
            cb()
          }
        })
      ]
      
      if (this.downstream) {
        streams.push(this.downstream)
      }

      await promisify(pipeline)(
        ...streams
      )

    } catch (pipeError) {
      forcePipeStop = true
      throw pipeError
    }

  }
}

module.exports = SuperLoop
