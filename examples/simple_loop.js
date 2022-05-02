const SuperLoop = require('../index');
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

