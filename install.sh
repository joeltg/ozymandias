curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
sudo apt-get install -y nodejs git

cd /usr/local/
sudo git clone https://github.com/joeltg/repl.git
sudo wget http://groups.csail.mit.edu/mac/users/gjs/6946/scmutils-tarballs/scmutils-20150730-x86-64-gnu-linux.tar.gz
sudo tar -xvzf scmutils-20150730-x86-64-gnu-linux.tar.gz
cd ./repl/server
sudo npm install
sudo ./server
