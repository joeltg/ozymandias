# repl

## Installation

### Server

#### Install NodeJS and Git

`sudo apt-get update`
`sudo apt-get install git nodejs npm`

#### Install MIT Scheme

`cd /usr/local/`
`sudo wget http://groups.csail.mit.edu/mac/users/gjs/6946/scmutils-tarballs/scmutils-20150730-x86-64-gnu-linux.tar.gz`
`sudo tar -xvzf scmutils-20150730-x86-64-gnu-linux.tar.gz`
`sudo rm scmutils-20150730-x86-64-gnu-linux.tar.gz`

#### Clone this repo and start the server

Clone this repo into a directory of your choice.

`cd repl/server`
`sudo npm install`
`nodejs server.js`

### Client

Clone this repo into a directory of your choice.
In `web/main.js`, replace `webSocketServerUrl` with the url of your
server (prefixed with `ws://`).