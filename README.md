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
sudo ./server
```

### Client

Clone this repo into a directory of your choice.
In `web/src/js/main.js`, replace `webSocketServerUrl` with the url of your
server (prefixed with `ws://`).

## Usage

All the fun graphics utilities are in `./server/utils`, which are loaded automatically in `./server/scheme`. There are three custom structures that are defined, which will be enumerated shortly.

Most of the graphics methods take an optional last parameter `push`. If `push` is provided and is `#f`, the method will not update the client with its effect, and will only modify local data structures. The effects of the method will be rendered on the client on the next call to `(update window)`, or the next time a method on the same window is called wit

If `push` is not provided or is not `#f`, `(update window)` will be called with the corresponding window argument.

### Windows

The `window` structure is defined in `./server/utils/window.scm`, and should be self-explanatory. 

#### Creating Windows

`(define window (make-window name push))`

Here, `name` is an optional string name. If a name is not provided, it will default to `"window-id"`, where `id` is a unique integer).

#### Updating Windows

`(update window [actions... ])`

The `update` function is Scheme's only graphics interface to the client, and it operates only at the window level (there is no updating of points or paths, just their parent windows). `update` takes a required window object as its first argument, followed by one or more window actions.

Valid window actions (as strings or symbols) are:
- `'clear`: removes all points and paths from the window (both locally and on the client).
- `'scale`: resizes the rendered window such that the horizontal and vertical axes have the same scale. This is useful for visualizing function plots without scaling distortion.
- `'close`: destroys the window on the client, but has no affect on the local window object. If the local window object is passed to `update` again, the client will treat it as if it was created for the first time.

The `update` function serializes the `window` object *and* the window object's child points and paths as JSON objects, and writes them to the output port. The Node.js server then pipes the graphics output to the client, which parses the JSON and extracts atomic window updates from the stream. Limiting updates to window granularity is admittedly wasteful (every point and path are sent over the network over and over again with each window update), but it meshes very well with the D3 model of updating, entering, and exiting from data joins, and is generally more functional and Lispy than issuing discrete, imperative commands. If network performance becomes a bottleneck, it's still possible to optimize this model by setting `clean` flags on points and paths and including them only when necessary.

### Points

Points render as an SVG 'circle' element. 

`(make-point window x y push)`

The window object is required, although `x` and `y` are both optional and will default to 0. 

Points have `radius` and `color` properties, which default to `"3px"` and `"black"`, respectively. These can be read and set through the default structure accessors.

```
1 ]=> (define window (make-window))
#| win |#
1 ]=> (define point (make-point window))
#| point |#
1 ]=> (point-color point)
#| "black" |#
1 ]=> (set-point-radius! point "5px")
;No return value.
1 ]=> (point-radius point)
#| "5px" |#
```

A `(point-move! point x y push)` procedure is also provided for convenience.

### Paths

Paths render as an SVG 'path' element.

`(make-path window points push)`

Here, `points` is a list of x and y coordinates, such as `'((0 0) (1 1) (2 2))`, although it is optional and defaults to the empty list. The `(plot f start stop step)` and `(parametrize f start stop step)` procedures are usually used for creating points.

```
1 ]=> (define points (plot square 0 4 1))
#| points |#
1 ]=> points
#| ((3 9) (2 4) (1 1) (0 0)) |#
1 ]=> (define path (make-path window points))
#| path |# 
1 ]=> (define circle (parametrize (lambda (theta) 
                                    (list (sin theta) (cos theta)))
                                  0 (* 2 pi) 0.1))
#| circle |#
1 ]=> circle
#|
((-.0830894028175026 .9965420970232169)
 (-.18216250427210112 .9832684384425836)
 (-.27941549819893097 .9601702866503645)
 (-.37387666483024096 .9274784307440339)
 (-.4646021794137613 .8855195169413168)
 ...)
|#
```

Append a point to a path with `(path-append! path point push)`, where `point` is a list of two numbers.

### Animation

Animate a point along a path with `(point-animate! point path duration translate push)`.
- `point` (required): point object
- `path` (required): path object
- `duration` (defaults to 0): duration of animation in milliseconds
- `translate`: one of either `'along` or `'over`
  - `'along` (default): animate the point at a constant speed along the path, regardless of how and where its constituent points are distributed.
  - `'over`: animate the point at a constant interval between each consecutive point in the path.

Animations only run once per update, although a `loop` parameter is coming soon.
