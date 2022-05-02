const SuperLoop = require('../index');
const stats = require('measured-core').createCollection();

async function main() {
    const intv = setInterval(function () {
        console.log(JSON.stringify(stats, null, 2));
    }, 1000);

    try {
        const producer = () => {
            stats.meter('producerTps').mark();
            // processing ...
            //console.log(data);
            //throw new Error('processing error');
            return [{name: 'John'}, {name: 'Alex'}]
        }

        const consumer = (data) => {
            stats.meter('consumerTps').mark();
            // processing ...
            //console.log(data);
            //throw new Error('processing error');
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

