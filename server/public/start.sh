#!/usr/bin/env bash

path=$1
pipe=$2

args=/pipes/${pipe}

scheme="/bin/scheme --silent --library /lib --load /utils/load --args ${args}"

exec schroot -c scheme -d / -- ${scheme}
