# repl

## Installation

### Server

#### Install Git

```
apt-get update
apt-get install git
```

#### Install NodeJS

```
curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
sudo apt-get install -y nodejs git
```

#### Install MIT Scheme

If you already have an MIT Scheme installation, you'll have to 
modify `./server/scheme` to point to the correct place.

```
cd /usr/local/
sudo wget http://groups.csail.mit.edu/mac/users/gjs/6946/scmutils-tarballs/scmutils-20150730-x86-64-gnu-linux.tar.gz
sudo tar -xvzf scmutils-20150730-x86-64-gnu-linux.tar.gz
```

#### Clone this repo and start the server

Clone this repo into a directory of your choice.

```
sudo git clone https://github.com/joeltg/repl.git
cd repl/server
sudo npm install
sudo ./server-from-distribution
```

### Client

Clone this repo into a directory of your choice.
In `web/src/connect-to-server.js`, replace `webSocketServerUrl` with the url of your
server (prefixed with `ws://`). 
`index.html` is the main entry point, and requires no other dependencies.
