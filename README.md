[![NPM](https://nodei.co/npm/super-loop.png)](https://www.npmjs.com/package/super-loop)

# Super Loop

Easy programming interface for producer-consumer problem, leveraging nodejs stream. 

It provides the following features: 
* repeats cycle for `n` times;
* repeats cycle until future moment;
* repeats cycle until "ender" function returns true;
* supports tps controlling;
* supports backpressure;
* supports max concurrency configuration;

## Why
----
Asynchronous event-based processing is quite common in modern microservice architecture. Here are some typical use cases: 

* Consume SQS messages at given max tps and max concurrency to fully utilize system capacity (e.g. CPU);
* Read upstream events and persist them to a NoSQL db at fast and controlled pace;
* Purge NoSQL db records selectively at fast and controlled pace;
* Process CSV files and call REST API at fast and controlled pace;


## Installation

```shell
npm i --save super-loop
```

## Usage Exampels

### Example 1 - simple loop

```js

const SuperLoop = require('super-loop');
const stats = require('measured-core').createCollection();

async function main() {
    const intv = setInterval(function () {
        console.log(JSON.stringify(stats));
    }, 1000);

    try {
        const f = (data) => {
            stats.meter('requestsPerSecond').mark();
            // processing ...
            //console.log(data);
            //throw new Error('processing error');
        }
        const loop = new SuperLoop();
        const lastFor = 120_000;

        loop.on('warn', (err) => {
            console.error(err);
        });

        await loop.invoke(f)
            .concurrency(1000)
            .rate(10000)
            //.repeat(100)
            .until(Date.now() + lastFor)
            .exec();

        console.log('loop ends')

    } catch (e) {
        console.error('something went wrong', e)
    }
    clearInterval(intv);
}

main().catch(console.error)

```

### Example 2 - producer consumer problem

```js
const SuperLoop =  require('super-loop');
const stats = require('measured-core').createCollection();

async function main() {
    const intv = setInterval(function () {
        console.log(JSON.stringify(stats, null, 2));
    }, 1000);

    try {
        const producer = () => {
            stats.meter('producerTps').mark();
            return [{name: 'John'}, {name: 'Alex'}]
        }

        const consumer = (data) => {
            stats.meter('consumerTps').mark();
            // processing ...
            //console.log(data);
        }

        const loop = new SuperLoop();
        const lastFor = 120_000;

        loop.on('warn', (err) => {
            console.error(err);
        });

        await loop.producedBy(producer)
            .consumedBy(consumer)
            .concurrency(200)
            .rate(1000)
            //.repeat(100)
            .until(Date.now() + lastFor)
            .exec();

        console.log('loop ends')

    } catch (e) {
        console.error('something went wrong', e)
    }
    clearInterval(intv);
}

main().catch(console.error)
```

## API

Super Loop API design follows [Fluent Interface](https://en.wikipedia.org/wiki/Fluent_interface).  All methods return `this`, except `exec` which kicks off the execution of the loop.

### consumedBy(f)

Configure consumer function. 

Arguments: 
* `f` is a function that take nodejs stream chunk as param, and returns nothing.

### producedBy(f)

Configure producer function.

Arguments: 
* `f` is a function that takes no param, but returns an Array of data chunks. 

### invoke(f)

Alias to `consumeBy`. 

### endedBy(f)

Configure ender function. When the ender function returns `true`, the loop ends.

Arguments: 
* `f` is a function that takes no param, but returns a boolean.  

### concurrency(maxC)

Configure max concurrency for consumer function.

Arguments: 
* `maxC` is the max concurrecy the consumer function would run at. 

### rate(tps)

Configure max tps for consumer function.

Arguments: 
* `tps` is the max tps the consumer function would run at. 

### until(endTime)

Configure timestamp (in `ms`) when the loop should stop. 

Arguments: 
* `endTime` timestamp in `ms`

### repeat(times)

Configure max repeats the producer function should be called. After max repeats are reached, loop ends. 

Arguments: 
* `times` max repeats

### exec() 

Starts the loop until one of the ending conditions is met. The ending condition is specified by `endedBy`, `until`, `repeat`. 

Returns:

* __Error__ if critical error happens in the internal nodejs streams

### Events

* `warn`. The loop emits non-critical errors when processing individual data chunks. Here is an example to catch them and log them properly: 

```js
loop.on('warn', (err) => {
    myLogger.error(err);
});
```


## License
super-loop is licensed under the MIT license.
