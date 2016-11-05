#!/usr/bin/env bash

path=$1
pipe=$2
user=$3

user_path=${path}/users/${user}
mkdir -p ${user_path}/pipes ${user_path}/files ${user_path}/etc ${user_path}/tmp
chmod a+rw ${user_path}/pipes ${user_path}/files

data_path=${user_path}/pipes/data.${pipe}
eval_path=${user_path}/pipes/eval.${pipe}
rm -f ${data_path} ${eval_path}
mkfifo ${data_path} ${eval_path}
