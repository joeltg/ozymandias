#!/usr/bin/env bash

path=$1

mkdir ${path}/users ${path}/jail
mkdir ${path}/jail/etc ${path}/jail/pipes
mkdir /etc/schroot/scheme

config="
SETUP_COPYFILES=\"scheme/copyfiles
SETUP_NSSDATABASES=\"scheme/nssdatabases
SETUP_FSTAB=\"scheme/fstab\"
"

fstab="
${path}/root/bin   /bin    none ro,bind 0 0
${path}/root/lib   /lib    none ro,bind 0 0
${path}/root/lib64 /lib64  none ro,bind 0 0
${path}/utils      /utils  none ro,bind 0 0
"

echo "${fstab}"         > /etc/schroot/scheme/fstab
echo "${config}"        > /etc/schroot/scheme/config
echo "/etc/resolv.conf" > /etc/schroot/scheme/copyfiles
echo ""                 > /etc/schroot/scheme/nssdatabases

scheme="
[scheme]
type=directory
directory=${path}/jail
groups=users
root-groups=root,sudo
profile=scheme
shell=/bin/bash
user-modifiable-keys=directory
"

echo "${scheme}" > /etc/schroot/chroot.d/scheme.conf