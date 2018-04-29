const WebSocket = require('isomorphic-ws');

const connections = new Set();
const resolvers = new Map();
const messages = new Map();


// Disabled until we can get confirmation that this is implemented in the
// daemon.

// const ping = () => new Promise(resolve => {
//
//     send({
//         cmd: 'ping',
//         'bzn-api': 'ping'
//     }, obj => resolve());
//
// });



// Non-polling actions

// - has
// - keys
// - read


// Polling actions

// - create
// - remove
// - update


let uuid;
let address;

const connect = (addr, id) => {
    uuid = id;
    address = addr;
};


const onMessage = (event, socket) => {

    const request = messages.get(event['request-id']);
    const resolver = resolvers.get(event['request-id']);

    resolvers.delete(event['request-id']);
    messages.delete(event['request-id']);


    if(event['request-id'] === undefined) {

        throw new Error('Received non-response message.');

    }

    if(event.error && event.error === 'NOT_THE_LEADER') {

        const isSecure = address.startsWith('wss://');

        const prefix = isSecure ? 'wss://' : 'ws://';

        const addressAndPort = prefix + event.data['leader-host'] + ':' + event.data['leader-port'];

        connect(addressAndPort, uuid);

        send(request, resolver);


    } else {

        resolver(event);

    }

};



// const disconnect = () =>
//     Promise.all(Array.from(connections).map(con =>
//         new Promise(resolve => {

//         con.onclose = () => {

//             connections.delete(con);
//             resolve();

//         };

//         con.close();

//     })));


const amendBznApi = obj =>
    Object.assign(obj, {
        'bzn-api': 'crud'
    });

const amendUuid = (uuid, obj) =>
    Object.assign(obj, {
        'db-uuid': uuid
    });


const amendRequestID = (() => {

    let requestIDCounter = 0;

    return obj =>
        Object.assign(obj, {
            'request-id': requestIDCounter++
        });

})();


const send = (obj, resolver, rejecter) => {

    const message = amendUuid(uuid , amendRequestID(obj));
    resolvers.set(message['request-id'], resolver);
    messages.set(message['request-id'], message);


    const s = new WebSocket(address);

    s.onopen = () => {

        s.send(JSON.stringify(message));

    };

    s.onerror = e =>  {

        s.close();
        rejecter(e);

    };

    s.onmessage = e => {
        onMessage(JSON.parse(e.data), s);
        s.close();
    };

};



// Non-polling actions

const read = key => new Promise((resolve, reject) => {

    const cmd = amendBznApi({
        cmd: 'read',
        data: {
            key
        }
    });


    send(cmd, obj =>
        obj.error ? reject(new Error(obj.error)) : resolve(obj.data.value), reject);

});


const has = key => new Promise((resolve, reject) => {

    const cmd = amendBznApi({
        cmd: 'has',
        data: {
            key
        }
    });


    send(cmd, obj => resolve(obj.data['key-exists']), reject);

});


const keys = () => new Promise((resolve, reject) => {

    const cmd = amendBznApi({
        cmd: 'keys'
    });

    send(cmd, obj => resolve(obj.data.keys), reject);

});



const poll = action => new Promise((resolve, reject) => {

    const pollRate = 200; // ms
    const pollTimeout = 2000;

    const start = new Date().getTime();


    (function loop() {

        action().then(v => {

            if(v) {

                resolve();

            } else {

                if(new Date().getTime() - start > pollTimeout) {

                    reject(new Error('Bluzelle poll timeout - command not commited to swarm.'));

                } else {

                    setTimeout(loop, pollTimeout);

                }

            }

        }, reject);

    })();

});


// Polling actions

const update = (key, value) => new Promise((resolve, reject) => {

    const cmd = amendBznApi({
        cmd: 'update',
        data: {
            key, value
        }
    });

    send(cmd, obj => {

        if(obj.error) {

            reject(new Error(obj.error));

        } else {

            const pollingFunc = () =>
                new Promise((res, rej) =>
                    read(key).then(v => res(v === value), rej));

            poll(pollingFunc).then(resolve, reject);

        }

    }, reject);

});


const create = (key, value) => new Promise((resolve, reject) => {

    const cmd = amendBznApi({
        cmd: 'create',
        data: {
            key, value
        }
    });

    send(cmd, obj => {

        if(obj.error) {

            reject(new Error(obj.error));

        } else {

            const pollingFunc = () =>
                new Promise((res, rej) =>
                    has(key).then(v => res(v), rej));

            poll(pollingFunc).then(resolve, reject);

        }

    }, reject);

});



const remove = key => new Promise((resolve, reject) => {

    const cmd = amendBznApi({
        cmd: 'delete',
        data: {
            key
        }
    });


    send(cmd, obj => {

        if(obj.error) {

            reject(new Error(obj.error));

        } else {

            const pollingFunc = () =>
                new Promise((res, rej) =>
                    has(key).then(v => res(!v), rej));

            poll(pollingFunc).then(resolve, reject);

        }

    }, reject);

});


module.exports = {
    getUuid: () => uuid,
    connect,
    create,
    read,
    update,
    remove,
    has,
    keys
};


