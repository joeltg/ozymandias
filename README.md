# repl

## Installation

### Server

#### Install NodeJS and Git

`apt-get update`
`apt-get install git nodejs npm`

#### Install MIT Scheme

If you already have an MIT Scheme installation, you'll have to 
modify `server/start-scheme` to point to the correct place.

`cd /usr/local/`

`wget http://groups.csail.mit.edu/mac/users/gjs/6946/scmutils-tarballs/scmutils-20150730-x86-64-gnu-linux.tar.gz`

`tar -xvzf scmutils-20150730-x86-64-gnu-linux.tar.gz`

`rm scmutils-20150730-x86-64-gnu-linux.tar.gz`

#### Clone this repo and start the server

Clone this repo into a directory of your choice.

`git clone https://github.com/joeltg/repl.git`

`cd repl/server`

`npm install`

`nodejs server.js`

### Client

Clone this repo into a directory of your choice.
In `web/main.js`, replace `webSocketServerUrl` with the url of your
server (prefixed with `ws://`).
