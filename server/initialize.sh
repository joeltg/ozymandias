#!/usr/bin/env bash

user_path=$1
pipe_path=$2

mkdir -p ${user_path}/pipes ${user_path}/files ${user_path}/etc
chmod a+rw root/pipes root/files
rm -f ${pipe_path}
mkfifo ${pipe_path}