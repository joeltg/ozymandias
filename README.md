# repl

Scheme is a beautiful language, but outside of Emacs it can be difficult to use. 
This project delivers Scheme as a modern IDE experience in the browser.
Actual computation is done on a server, which interfaces with the client over the WebSocket protocol.

## Usage

By default, `repl` renders a split view of an editor and a repl. 
The lower repl pane is a direct stdio stream from the scheme subprocess: everything that is written to stdin and everything that comes out of stdout is also shown in the repl.
It's useful for debugging and for one-liners.
The upper editor pane is a high-level abstraction, where expressions can be evaluated inline and values can be visualized in generic ways.
It's useful for writing systems and for prose.

The help panels on each pane summarize the available keyboard shortcuts and commands - if you're already used to Emacs or Sublime, most of the existing commands should work here as well.

## Installation
These instructions assume Ubuntu 14.04 or higher.
They'll probably work also with earlier versions, other *nixes, and maybe even macOS, but that's never been tried.

You need Node v6+. If you don't have it, get it:
```
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs
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
```
sudo ./schroot.sh <path>
```
Now start the server:
```
npm run dev
> socket listening on port 1947
> server listening on port 3000
```
Then navigate to `http://localhost:3000`.

## Notes

### Authentication
This is designed to be extensible.
As such, it is built to support multiple user accounts and authentication mechanisms.
The directions above create a default user that is used by default in the client-side code in `src/authentication.js`; however this can easily be adapted to an auth system of your choice.

### Building from source
The directions above only install the minimum dependencies to run the server.
The contents of the `web` directory are generated with Webpack and Babel, so if you want to make any changes you'll have to run `npm install`.
Make your changes in `src`, then run `npm run build` to regenerate the JavaScript and CSS assets that the Express server actually serves to the client.

### Credits

None of this would be possible without the incredible work of many free and open-source projects, and none of them get enough thanks:

- scmutils
- CodeMirror
- D3.js
- jQuery
- jQuery UI
- Katex

And obligatory thanks to Prof. Gerry Sussman for his indispensable insight and guidance.
