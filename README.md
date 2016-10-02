# repl

## Installation
These instructions assume Ubuntu 14.04 or higher.
They'll probably work also with earlier versions, other *nixes, and maybe even macOS, but that's never been tried.

You need Node v6+. If you don't have it, get it:
```
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs nodejs-legacy
```
You also need `git` and `schroot`, if you don't already:
```
sudo apt-get install -y git schroot
```
Clone this repo into `<path>`:
```
git clone https://github.com/joeltg/repl.git
cd repl
npm install --production
```
There's some setup that has to be done to configure the schroot jails.
Here, `<path>` is the absolute path to the cloned `repl` directory (inclusive).
Make `<owner>` someone you trust, like yourself:
```
sudo ./schroot/make-jail.sh <path> /usr/local/scheme
sudo ./schroot/make-user.sh <path> root <owner>
```
Now start the server:
```
npm start
```
If you see something like this, you did it right:
```
socket listening on port 1947
server listening on port 3000
```
Then navigate to `http://localhost:3000`. Otherwise, something went terribly wrong.

## Notes

### Authentication
This is designed to be extensible.
As such, it is built to support multiple user accounts and authentication mechanisms.
The directions above create a default user `root`, and this is used by default in the client-side code in `src/authentication.js`.
To add a user  to the system, run `sudo ./schroot/make-user.sh <path> <user> <owner>`, and add some log-in mechanism to `src/authenticate.js` (server) and `src/main.js` (client).

### Building from source
The directions above only install the minimum dependencies to run the server.
The contents of the `web` directory are generated with Webpack and Babel, so if you want to make any changes you'll have to `npm install` to get all the `devDependencies`.
Make your changes in `src`, then run `npm run build` to regenerate the JavaScript and CSS assets that the Express server actually serves to the client.

### Credits

None of this would be possible without the incredible work of many free and open-source projects, and none of them get enough thanks:
- scmutils
- CodeMirror
- D3.js
- jQuery
- jQuery UI
- Katex
