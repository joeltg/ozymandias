#!/usr/bin/env bash

user=$1
path=${PWD}/users/${user}

mkdir -p ${path}/etc ${path}/pipes ${path}/files ${path}/tmp
chmod a+rw ${path}/files ${path}/pipes
