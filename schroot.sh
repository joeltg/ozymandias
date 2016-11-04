#!/usr/bin/env bash

path=$1

mkdir -p ${path}/users ${path}/jail
mkdir -p ${path}/jail/etc ${path}/jail/pipes
mkdir -p ${path}/schroot

config="
CHROOT_DIRECTORY=\${FOO_BAR}

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
foo.bar=${path}/jail/
user-modifiable-keys=foo.bar
"

echo "${scheme}" > /etc/schroot/chroot.d/scheme.conf
