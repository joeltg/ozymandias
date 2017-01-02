#!/usr/bin/env bash

path=${PWD}
jail=${path}/jail
root=/etc/schroot/scheme

mkdir -p ${path}/users ${jail}
mkdir -p ${jail}/etc ${jail}/pipes ${jail}/files
mkdir -p ${root}

chmod a+w ${jail} ${jail}/files ${jail}/pipes

config="
CHROOT_DIRECTORY=\${USER_PATH}

SETUP_COPYFILES=scheme/copyfiles
SETUP_NSSDATABASES=scheme/nssdatabases
SETUP_FSTAB=scheme/fstab
"

fstab="
${path}/root/bin   /bin    none ro,bind 0 0
${path}/root/lib   /lib    none ro,bind 0 0
${path}/root/lib64 /lib64  none ro,bind 0 0
${path}/utils      /utils  none ro,bind 0 0
"

echo "${fstab}"         > ${root}/fstab
echo "${config}"        > ${root}/config
echo "/etc/resolv.conf" > ${root}/copyfiles
echo ""                 > ${root}/nssdatabases

scheme="
[scheme]
type=directory
directory=${path}/jail
groups=users
root-groups=root,sudo
profile=scheme
shell=/bin/bash
user.path=${path}/jail/
user-modifiable-keys=user.path
"

echo "${scheme}" > /etc/schroot/chroot.d/scheme.conf
