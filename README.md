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

Asynchronous event-based processing is quite common in modern microservice architecture. Here are some typical use cases: 

* Consume SQS messages at given max tps and max concurrency to fully utilize system capacity (e.g. CPU);
* Read upstream events and persist them to a NoSQL db at fast and controlled pace;
* Purge NoSQL db records selectively at fast and controlled pace;
* Process CSV files and call REST API at fast and controlled pace;


## Installation

```shell
npm i --save super-loop
```

## Example

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

## API

TBC
