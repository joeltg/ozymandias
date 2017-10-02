import {ipcRenderer} from "electron"
import {pipe} from './pipe';

function send(type, data) {
    ipcRenderer.send('asynchronous-message', JSON.stringify({type, data}));
}

ipcRenderer.on('asynchronous-reply', (event, arg) => pipe(JSON.parse(arg)));

export {send}