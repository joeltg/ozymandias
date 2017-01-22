# lambda

Scheme is a beautiful language, but for those afraid of Emacs it can be difficult to use, and things that are difficult to use are difficult to learn.
This project is a modern MIT Scheme environment in the browser that tries to be beginner-friendly.
Actual computation is done on a server, which interfaces with the client over a WebSocket.

## Usage

The editor is a high-level abstraction on top of both input and output, where expressions can be evaluated inline and values can be visualized in generic ways. 
This is a little different than the usual editor/repl split, and is more similar to LightTable or the Hydrogen plugin for Atom than traditional editors.

For example, typing `(apply vector (map square (iota 3)))` in the editor and then evaluating it with `Ctrl-Enter` will print the commented result `#(0 1 4)` below the expression. But we can also tab between Scheme object and TeX representations of results:

![such graphics, many latex](lambda.gif)

You can also do a ton of fun symbolic computing thanks to [scmutils](https://groups.csail.mit.edu/mac/users/gjs/6946/refman.txt):

![much symbol, so algebra](lambda2.gif)

The help panel summarizes the available keyboard shortcuts and commands - if you're already used to Emacs or Sublime, most of the existing commands should work here as well.

## Installation
These instructions assume you want to host your own server and have Ubuntu 14.04 or higher.
It probably works with earlier versions, other \*nixes, and maybe even macOS, but that's never been tried.
If you try to run it on Windows, Gerry Sussman will hunt you down and throw chalk at you.

You also need Node v6+ and `schroot`, if you don't already. Since each Scheme subprocess is sandboxed in a chroot jail, the server needs to be run with sudo permissions so it can write to `/etc/schroot` and manipulate file mounts.

```
npm install
npm run build
sudo nodejs server/server.js
> socket listening on port 1947
> server listening on port 3000
```
... and it's live on `http://localhost:3000`! Amazing.

## Notes

### Authentication
Lambda is designed to support user accounts. I've written two authentication modules in `server/authentication/` for MIT Touchstone and GitHub, but it's designed to be extensible. Any scheme (ha) you want to implement just has to attach the appropriate routing middleware to the express app, and pass the appropriate username into every new `Connection`. The default is the `null` user, which is a shared directory, readable and writable by everyone.

### Credits

None of this would be possible without the incredible work of many free and open-source projects, and none of them get enough thanks:

- scmutils
- CodeMirror
- D3.js
- Katex

And obligatory thanks to Professor Sussman for his indispensable insight and guidance.
