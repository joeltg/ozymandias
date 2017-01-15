/**
 * Created by joel on 8/28/16.
 */

const socket = new WebSocket(`ws://${window.location.hostname}:1947/${window.uuid}`);

function send(source, content) {
    if (socket.readyState === 1) {
        socket.send(JSON.stringify({source, content}));
    }
}

export {socket, send};