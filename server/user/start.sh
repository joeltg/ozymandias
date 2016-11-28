#!/usr/bin/env bash

path=$1
pipe=$2
user=$3

name=${path}/users/${user}
args=/pipes/${pipe}

scheme="/bin/scheme --silent --library /lib --load /utils/load --args ${pipe}"

exec schroot -c scheme -d / -o user.name=${name} -- ${scheme}
