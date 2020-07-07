const functions  = require('../index.js');
const firebase = require('firebase-functions-test');

test('It lists the announcement into firestore.', async done => {
    const test = firebase({
        databaseURL: process.env.FIRESTORE_URL,
        projectId: process.env.FIRESTORE_OBJECT
    }, '/opt/workdir/service-account-file.json');

    const req = { query: {limit: 10} };
    const res = {
        status: (status) => {
            expect(status).toStrictEqual(200);

            return res;
        },
        send: (body) => {
            expect(body.length).toStrictEqual(10);
            done();
        }
    };

    functions.announcements(req, res);

    test.cleanup();
});
