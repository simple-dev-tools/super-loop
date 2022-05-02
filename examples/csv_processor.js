const csv = require('csv-parser');
const fs = require('fs');

const SuperLoop = require('../index');
const stats = require('measured-core').createCollection();

async function main() {
    const intv = setInterval(function () {
        console.log(JSON.stringify(stats, null, 2));
    }, 1000);

    try {

        const upstream = fs.createReadStream('./examples/csv_sample.csv').pipe(csv())

        const consumer = (data) => {
            stats.meter('consumerTps').mark();
            // processing ...
            // console.log(data)
            // calling another API to process csv records
            //throw new Error('processing error');
        }

        const loop = new SuperLoop();
        const lastFor = 120_000;

        loop.on('warn', (err) => {
            console.error(err);
        });

        await loop.pipeFrom(upstream)
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

