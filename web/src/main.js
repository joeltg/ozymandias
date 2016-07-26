/**
 * Created by joel on 7/15/16.
 */

const socket = new WebSocket(websocket_url);

const repl_delimiter = /\s*\n\d+\s(?:(?:]=)|(?:error))>\s/, pipe_delimiter = '\n';
let repl_buffer = '', pipe_buffer = '';

const sources = {
    repl(content) {
        push_repl(content, false);
        const repl_values = (repl_buffer + content).split(repl_delimiter);
        repl_buffer = repl_values.pop();
        repl_values.forEach(push_editor);
    },
    pipe(content) {
        const pipe_values = (pipe_buffer + content).split(pipe_delimiter);
        pipe_buffer = pipe_values.pop();
        pipe_values.map(JSON.parse).forEach(handle_graphics_message);
    }
};

push_repl('connecting to server...\n', false);
const send_data = (source, content) => socket.readyState === 1 && socket.send(JSON.stringify({source, content}));
socket.onopen = event => push_repl('connected to server.\n', false);
socket.onmessage = event => (({source, content}) => sources[source](content))(JSON.parse(event.data));
socket.onclose = event => push_repl('lost connection to server.\n', false);