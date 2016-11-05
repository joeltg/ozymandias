#!/usr/bin/env bash

path=$1
pipe=$2

mkdir -p ${path}/jail ${path}/jail/pipes ${path}/jail/files ${path}/jail/etc ${path}/jail/tmp
chmod a+rw ${path}/jail/pipes

data_path=${path}/jail/pipes/data.${pipe}
eval_path=${path}/jail/pipes/eval.${pipe}
rm -f ${data_path} ${eval_path}
mkfifo ${data_path} ${eval_path}
