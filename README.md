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
If you try to run it on Windows, Prof. Sussman will hunt you down and throw chalk at you.

You also need Node v6+ and `schroot`, if you don't already.
Before running the server, you need to configure some schroot jails:
```
sudo ./make-schroot.sh
```
and then finally:
```
npm install
npm run build
npm run dev
> socket listening on port 1947
> server listening on port 3000
```
... and it's live on `http://localhost:3000`! Amazing.

## Notes

### Authentication
I'm using GitHub for authentication and user accounts right now,b ut it's designed to be pretty extensible. 
Any scheme (ha) you implement just has to execute `./make-user.sh [user]` to create a user, and pass the appropriate `user` name into every new `Connection`. The default is the `null` user, which is a public, shared schroot directory in `/jail`.

### Extension
For every client connection, the server starts a new schroot jail from the appropriate user's folder (so that `/users/[user]/files/[foo.scm]` is mounted at `/files/[foo.scm]`). The schroot jail also creates a read-only mount of `/root`, which contains the actual Scheme library and some extra utilities. You can add files in here and they'll show up in all the schroots.

### Credits

None of this would be possible without the incredible work of many free and open-source projects, and none of them get enough thanks:

- scmutils
- CodeMirror
- D3.js
- Katex

And obligatory thanks to Prof. Gerry Sussman for his indispensable insight and guidance.
