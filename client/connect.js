/**
 * Created by joel on 8/28/16.
 */

const socket = new WebSocket(websocket_url || `ws://${window.location.hostname}:1947`);

function send(source, content) {
    console.log('sending');
    if (socket.readyState === 1) {
        socket.send(JSON.stringify({source, content}));
    }
}

export {socket, send};