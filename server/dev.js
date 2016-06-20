/**
 * Created by joel on 6/16/16.
 */
var WebSocketServer = require('ws').Server;
var server = new WebSocketServer({ port: 1947 });
console.log('listening');
var child_process = require('child_process');



