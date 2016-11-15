#!/usr/bin/env bash

path=$1
pipe=$2
user=$3

user_path=${path}/users/${user}
mkdir -p ${user_path}/pipes ${user_path}/files ${user_path}/etc ${user_path}/tmp
chmod a+rw ${user_path}/pipes ${user_path}/files

pipe_path=${user_path}/pipes/data-${pipe}
print_path=${user_path}/pipes/print-${pipe}
rm -f ${pipe_path} ${print_path}
mkfifo ${pipe_path} ${print_path}
