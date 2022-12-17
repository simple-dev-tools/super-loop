// TEST REST ENDPOINT, where it's service is hosted in GCP Cloud Run

const { GoogleAuth } = require('google-auth-library');
const SuperLoop = require('super-loop');
const { Readable } = require('node:stream');
const stats = require('measured-core').createCollection();
const histogram = stats.histogram('latency');

const BASE_URL = process.env.API_BASE_URL;

// decode private key if stored in base64 form
const SA_KEY = JSON.parse(
    Buffer.from(process.env.GCP_IAM_KEY, 'base64').toString(
        'ascii',
    ),
);

const auth = new GoogleAuth({
    credentials: SA_KEY
});

let client = null;

async function invoke(url, body) {
    // client can be reused
    if (client == null) {
        client = await auth.getIdTokenClient(process.env.TARGET_AUDIENCE); // set baseUrl as targetAudience
    }
    return client.request({
        method: 'POST',
        url,
        data: {
            ...body,
        },
    });
}

let startIndex = 99900000000;

async function send_message(offset) {
    const testTarget = `${BASE_URL}/send_message`;

    const index = startIndex + offset;

    const txId = `pt-tx-${index}`;
    let userId = `${index}`;

    if (index % 2000 == 0) { // interleaving some special data in the feed
        userId = '8888888'
    }

    try {
        const result = await invoke(testTarget, {
            "transactionId": txId,
            "userId": userId,
            "topic": "MESSAGE_TYPE_1",
            "title": "G'day mate!",
            "body": "This is a good day!",
            "eventTimestamp": "2022-02-10T05:35:31.165Z",
            "correlationId": "12333abc",
            "pt": true
        });
        console.log(JSON.stringify(result.data));
    } catch (err) {
        if (err?.response?.data?.code >= 400 ||  err?.response?.data?.code < 500) {
            console.log(JSON.stringify(err?.response?.data));
        } else {
            console.error('failed to send message', err);
        }
    }
}


// pumping requests using super-loop
// measurement is done using measured-core
(async function () {
    const intv = setInterval(function () {
        console.log(JSON.stringify(stats, null, 2));
        //console.log(histogram.toJSON());
    }, 1000);

    const sloop = new SuperLoop();
    sloop.on('warn', (e) => {
        console.warn(e);
    });
    
    await sloop.pipeFrom(Readable.from(Array.from(Array(1_000_000).keys())))
        .rate(75)
        .concurrency(200)
        .invoke(async function (data) {
            stats.meter('throughput').mark();
            const ts_from = Date.now();
            await send_message(data);
            const latency = Date.now() - ts_from;
            histogram.update(latency); 
        })
        .exec();

    clearInterval(intv);

}()).catch(console.error);
