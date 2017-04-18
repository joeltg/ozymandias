/**
 * Created by joel on 8/28/16.
 */



const socket = new WebSocket(`ws://${host || window.location.hostname}:${window.port}?uuid=${window.uuid}`, 'ozymandias');

function send(type, data) {
    if (socket.readyState === 1) {
        socket.send(JSON.stringify({type, data}));
    }
}

export {socket, send};
