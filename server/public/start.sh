#!/usr/bin/env bash

path=$1
pipe=$2

cmd=/bin/scheme
lib=/lib
load=/utils/load.scm

exec schroot -c scheme -d / -- ${cmd} --library ${lib} --load ${load} --args ${pipe}