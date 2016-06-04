#!/bin/bash
sudo apt-get update
sudo apt-get install git nodejs npm

cd ~/
sudo wget http://groups.csail.mit.edu/mac/users/gjs/6946/scmutils-tarballs/scmutils-20150730-x86-64-gnu-linux.tar.gz
cd /usr/local/
sudo tar -xvzf ~/scmutils-tarballs/scmutils-20150730-x86-64-gnu-linux.tar.gz

cd ~/
sudo git clone https://github.com/joeltg/repl.git
cd repl
sudo mv scheme /usr/local/bin/mit-scheme
sudo npm install
nodejs server.js
