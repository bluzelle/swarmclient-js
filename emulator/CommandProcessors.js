const {maxNodes} = require('./Values');
const {create, read, update, delete:delet, has, keys, size} = require('./DataStore');
const {getAllNodesInfo} = require('./NodeStore.js');
const assert = require('assert');


const CommandProcessors = {

    setMaxNodes: num => maxNodes.set(num),

    requestAllNodes: ({data}, connection) =>
        connection.send(JSON.stringify({cmd: 'updateNodes', data: getAllNodesInfo()})),
    
    ping: ({'request-id': request_id}, ws) => {

        ws.send(JSON.stringify({
            'request-id': request_id
        }))

    },
    create,
    read,
    update,
    'delete': delet,
    has,
    keys,
    size

};


module.exports = CommandProcessors;
