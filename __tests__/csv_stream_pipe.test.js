const csv = require('csv-parser');
const { Writable } = require('stream')
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

    it('#process csv file and write to downstream', async () => {

        const upstream = fs.createReadStream(`${__dirname}/small_data.csv`).pipe(csv())

        const loop = new SuperLoop();
        let counter = 0;

        const f = (rawEvent) => {
            counter += 1;
            return {
                data: {
                    index: rawEvent.Index,
                    height: rawEvent.Height,
                    weight: rawEvent.Weight
                }
            }
        }


        const wResults = [];
        const writer = new Writable({
            objectMode: true,
            write(data, _, done) {
                wResults.push(data)
                done()
            }
        })

        await loop.pipeFrom(upstream).invoke(f).pipeTo(writer).exec();
        expect(counter).toBe(3);
        expect(wResults).toMatchSnapshot()

    });

})