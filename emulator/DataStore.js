const {observable, toJS, observe} = require('mobx');
const {forEach} = require('lodash');
const {nodes} = require('./NodeStore');
const {defaultUuid} = require('./Emulator');


const uuids = observable.map({});
const createDb = uuid => uuids.set(uuid, observable.map({}));


const retrieveDb = uuid => {

    if(!uuids.has(uuid)) {
        createDb(uuid);
    };

    return uuids.get(uuid);

};


const respondSuccess = (uuid, request_id, ws) => {
    if (ws) {
        ws.send(JSON.stringify(
            {
                msg: 'setup complete',
                'request-id': request_id
            }
        ));
    } else {
        process.env.emulatorQuiet ||
            console.log(`******* SETUP: createDB ${uuid} *******`);
    }
};

const respondError = (uuid, request_id, ws) => {
    if (ws) {
        ws.send(JSON.stringify(
            {
                error: `Sorry, the uuid, ${uuid}, is already taken.`,
                'request-id': request_id
            }
        ));
    } else {
        process.env.emulatorQuiet ||
            console.log(`******* SETUP: ${uuid} in already in uuids ********`);
    }
};

module.exports = {

    uuids,

    read: ({'db-uuid':uuid, 'request-id': request_id, data:{key}}, ws) => {

        const data = retrieveDb(uuid);

        if(data.has(key)) {

            ws.send(JSON.stringify(
                {
                    cmd: 'update',
                    data:
                        {
                            key,
                            value: data.get(key)
                        },
                    'request-id': request_id
                }
            ));

        } else {

            ws.send(JSON.stringify(
                {
                    error: `Key "${key}" not in database.`,
                    'request-id': request_id
                }
            ));

        }
    },

    create: ({'db-uuid':uuid, 'request-id': request_id, data:{key, value}}, ws) => {

        const data = retrieveDb(uuid);


        if(data.has(key)) {

            ws.send(JSON.stringify(
                {
                    error: `Key '${key}' already in database.`,
                    'request-id': request_id
                }
            ));

            return;

        }

        data.set(key, value);

        ws.send(JSON.stringify(
            {
                'request-id': request_id
            }
        ));
    },

    update: ({'db-uuid':uuid, 'request-id': request_id, data:{key, value}}, ws) => {

        const data = retrieveDb(uuid);


        if(!data.has(key)) {

            ws.send(JSON.stringify(
                {
                    error: `Key '${key}' not in database.`,
                    'request-id': request_id
                }
            ));

            return;

        }

        data.set(key, value);

        ws.send(JSON.stringify(
            {
                'request-id': request_id
            }
        ));
    },

    has: ({'db-uuid':uuid, 'request-id': request_id, data:{key}}, ws) => {

        const data = retrieveDb(uuid);

        ws.send(JSON.stringify(
            {
                data:
                    {
                        'key-exists': data.has(key)
                    },
                'request-id': request_id
            }
        ));
    },

    'delete': ({'db-uuid':uuid, 'request-id': request_id, data:{key}}, ws) => {

        const data = retrieveDb(uuid);

        if(data.has(key)) {

            data.delete(key);

            ws.send(JSON.stringify(
                {
                    'request-id': request_id
                }
            ));

        } else {

            ws.send(JSON.stringify(
                {
                    error: `Key "${key}" not in database.`,
                    'request-id': request_id
                }
            ));

        }

    },

    keys: ({'db-uuid': uuid, 'request-id': request_id}, ws) => {
        
        const data = retrieveDb(uuid);

        ws.send(JSON.stringify(
            {
                data: {
                    keys: data.keys()
                },
                'request-id': request_id
            }
        ));

    },

    size: ({'db-uuid': uuid, 'request-id': request_id}, ws) => {

        const data = retrieveDb(uuid);

        let accumulator = 0;

        data.forEach((value) => accumulator += value.length * 2);

        ws.send(JSON.stringify(
            {
                data: {
                    size: accumulator
                },
                'request-id': request_id
            }
        ));

    },

    getData: (uuid = defaultUuid) =>
        retrieveDb(uuid),

    setData: (uuid = defaultUuid, obj) => {
        const data = retrieveDb(uuid);
        data.clear();
        data.merge(obj);
    }
};
