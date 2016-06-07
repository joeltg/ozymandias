#!/bin/bash
sudo apt-get update
sudo apt-get install git nodejs npm

cd /usr/local/
sudo wget http://groups.csail.mit.edu/mac/users/gjs/6946/scmutils-tarballs/scmutils-20150730-x86-64-gnu-linux.tar.gz
sudo tar -xvzf scmutils-20150730-x86-64-gnu-linux.tar.gz
sudo rm scmutils-20150730-x86-64-gnu-linux.tar.gz

sudo mkdir /opt/webscheme
cd /opt/webscheme
sudo git clone https://github.com/joeltg/repl.git
cd repl
sudo npm install
nodejs server.js
