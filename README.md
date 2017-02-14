# Ozymandias
Scheme is a beautiful language, but for those afraid of Emacs it can be difficult to use. 
This project is a modern MIT Scheme environment for the browser that tries its best to be friendly and usable.

- [Demo](http://ozymandias.xyz/files/Demo.scm)
- [This page, but with worse CSS](http://joelgustafson.com/ozymandias)

## Overview

![diagram](https://raw.githubusercontent.com/joeltg/ozymandias/master/docs/images/diagram.svg)

Ozymandias is more similar to [LightTable](http://lighttable.com/) or the [Hydrogen plugin](https://atom.io/packages/hydrogen) for Atom than traditional editors. 
Expressions are evaluated with `Ctrl-Enter` (or `Cmd-Enter`), and results are inlined below each expression. 
When appropriate, you can tab between Scheme object, pretty-printed, or Tex representations of values.

![evaluation](https://raw.githubusercontent.com/joeltg/ozymandias/master/docs/images/a.gif)

... you can plot functions and their derivatives...

![graphics](https://raw.githubusercontent.com/joeltg/ozymandias/master/docs/images/b.gif)

... or find the Lagrangian of a harmonic oscillator...

![oscillator](https://raw.githubusercontent.com/joeltg/ozymandias/master/docs/images/d.gif)

... and there's even a primitive debugger!

![debug](https://raw.githubusercontent.com/joeltg/ozymandias/master/docs/images/e.gif)

The help panel summarizes the available keyboard shortcuts and commands - if you're already used to Emacs or Sublime, most of the existing commands should work here as well. Safari won't let clients override some shortcuts (like `Cmd-O` for opening files), so either use Chrome/FF or just click on the entry in the help panel. 

## Installation
Things you need to run your own server:

- [Node.js](https://nodejs.org/en/) v6+
- [mit-scheme](https://github.com/joeltg/mit-scheme)
- [schroot](https://wiki.debian.org/Schroot)
- Ubuntu 14.04+ / Debian 8+

It probably works with earlier versions, other \*nixes, and maybe even macOS, but it's never been tried.
If you try to run it on Windows, Gerry Sussman will hunt you down and throw chalk at you.

The `mit-scheme` npm package (on [GitHub](https://github.com/joeltg/mit-scheme) and [npm](https://www.npmjs.com/package/mit-scheme)) is a sister project; it wraps a native MIT Scheme instance in a NodeJS Duplex Stream that is easier to interface with. Since it needs to write config files to `/etc/schroot`, you'll need to install it globally and with permissions.

Things you do:

```
sudo apt-get install schroot
sudo npm install -g mit-scheme --unsafe-perm

git clone https://github.com/joeltg/ozymandias.git
cd ozymandias

npm link mit-scheme
npm install
npm run build
npm start

> server listening on port 3000
```

... and it's live on `http://localhost:3000`. Amazing.

## Notes

### Configuration
Ozymandias uses [dotenv](https://www.npmjs.com/package/dotenv) for a few configuration options:
- `PORT` (default 3000): TCP port that the server listens on
- `SCMUTILS` (default true): run Scheme with the scmutils library

### Permissions & Security
Each Scheme subprocess is sandboxed in a chroot jail, but it's not that secure and you should expect Scheme to be able to execute arbitrary code on your computer. Don't run this publicly on a machine you really care about.

### Authentication
Ozymandias is designed to support user accounts, but I'm scared to document them because I don't know what I'm doing. You can peek in `server/authentication/` if you're really curious.

## Credits

None of this would be possible without the incredible work of many free and open-source projects, and none of them get enough thanks:

- [scmutils](https://groups.csail.mit.edu/mac/users/gjs/6946/)
- [CodeMirror](https://github.com/codemirror/CodeMirror)
- [D3.js](https://github.com/d3/d3)
- [Katex](https://github.com/Khan/KaTeX)

And obligatory thanks to Professor Sussman for his indispensable insight and guidance.
