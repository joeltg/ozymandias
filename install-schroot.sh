#!/usr/bin/env bash

path=${PWD}
jail=${path}/jail

mkdir -p ${path}/users ${jail}
mkdir -p ${jail}/etc ${jail}/pipes ${jail}/files
mkdir -p ${path}/schroot

chmod a+w ${jail}/files ${jail}/pipes

config="
CHROOT_DIRECTORY=\${USER_NAME}

SETUP_COPYFILES=\"../..${path}/schroot/copyfiles\"
SETUP_NSSDATABASES=\"../..${path}/schroot/nssdatabases\"
SETUP_FSTAB=\"../..${path}/schroot/fstab\"
"

fstab="
${path}/root/bin   /bin    none ro,bind 0 0
${path}/root/lib   /lib    none ro,bind 0 0
${path}/root/lib64 /lib64  none ro,bind 0 0
${path}/utils      /utils  none ro,bind 0 0
"

echo "${fstab}"         > ${path}/schroot/fstab
echo "${config}"        > ${path}/schroot/config
echo "/etc/resolv.conf" > ${path}/schroot/copyfiles
echo ""                 > ${path}/schroot/nssdatabases

scheme="
[scheme]
type=directory
directory=${path}/jail
groups=users
root-groups=root,sudo
profile=../../${path}/schroot
shell=/bin/bash
user.name=${path}/jail/
user-modifiable-keys=user.name
"

echo "${scheme}" > /etc/schroot/chroot.d/scheme.conf
