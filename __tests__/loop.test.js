const SuperLoop = require('../src/superloop');

describe('SuperLoop unit test', () => {

    it('#invoke function for x time', async () => {
        const loop = new SuperLoop();
        let counter = 0;
        const f = () => {
            counter += 1;
        }

        await loop.invoke(f).repeat(5).exec();
        expect(counter).toBe(5);
    });

    it('#invoke function until specified timestamp', async () => {
        const f = () => {
            // do nothing
        }
        const loop = new SuperLoop();
        const startTime = Date.now();
        const lastForSeconds = 2_000; // for 2 seconds
        await loop.invoke(f)
            .concurrency(100)
            .rate(100)
            .until(Date.now() + lastForSeconds)
            .exec();
        const actualTimeElpased = Date.now() - startTime;
        expect(Math.abs(actualTimeElpased - lastForSeconds)).toBeLessThan(500); // all 500ms room
    });

    it('#produce x times, consume all', async () => {
        const loop = new SuperLoop();
        let counter = 0;
        const producer = () => {
            return [{name: 'John'}, {name: 'Alex'}];
        }
        const consumer = (data) => {
            counter += 1;
        }

        await loop.producedBy(producer).consumedBy(consumer).repeat(5).exec();
        expect(counter).toBe(10);
    });

    it('#produce/consume until specified timestamp', async () => {
        const producer = () => {
            return [{name: 'John'}, {name: 'Alex'}];
        }
        const consumer = (data) => {
            // do nothing
        }
        const loop = new SuperLoop();
        const startTime = Date.now();
        const lastForSeconds = 2_000; // for 2 seconds
        await loop.
            producedBy(producer)
            .consumedBy(consumer)
            .concurrency(100)
            .rate(100)
            .until(Date.now() + lastForSeconds)
            .exec();
        const actualTimeElpased = Date.now() - startTime;
        expect(Math.abs(actualTimeElpased - lastForSeconds)).toBeLessThan(500); // all 500ms room
    });


    it('end loop if enderFunc returns true', async () => {
        const producer = () => {
            return [{name: 'John'}, {name: 'Alex'}];
        }
        let counter = 0;
        const consumer = (data) => {
            ++counter
        }

        const ender = () => {
            return counter > 8;
        }

        const loop = new SuperLoop();
        const startTime = Date.now();
        const lastForSeconds = 2_000; // for 2 seconds
        await loop.
            producedBy(producer)
            .consumedBy(consumer)
            .concurrency(100)
            .rate(100)
            .endedBy(ender)
            .exec();

        expect(counter).toBe(10);
        
    });

});
