/**
 * Created by joel on 8/20/16.
 */

function connection(socket) {
    console.log('connected!');
    socket.on('message', e => console.log(e));
}

module.exports = connection;