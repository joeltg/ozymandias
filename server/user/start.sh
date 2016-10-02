#!/usr/bin/env bash

path=$1
pipe=$2
user=$3

dir=${path}/users/${user}
cmd=/bin/scheme
lib=/lib
load=/utils/load.scm

exec schroot -c scheme -d / -o foo.bar=${dir} -- ${cmd} --library ${lib} --load ${load} --args ${pipe}
