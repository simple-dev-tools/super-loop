const csv = require('csv-parser');
const fs = require('fs');
const SuperLoop = require('../src/superloop');

describe('SuperLoop custom Readable as stream', () => {

    it('#process csv file', async () => {

        const upstream = fs.createReadStream(`${__dirname}/small_data.csv`).pipe(csv())

        const loop = new SuperLoop();
        let counter = 0;
        const f = () => {
            counter += 1;
        }

        await loop.pipeFrom(upstream).invoke(f).exec();
        expect(counter).toBe(3);
        
    });

})