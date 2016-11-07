#!/usr/bin/env bash

path=$1
pipe=$2

mkdir -p ${path}/jail ${path}/jail/pipes ${path}/jail/files ${path}/jail/etc ${path}/jail/tmp
chmod a+rw ${path}/jail/pipes

pipe_path=${path}/jail/pipes/${pipe}
rm -f ${pipe_path}
mkfifo ${pipe_path}
