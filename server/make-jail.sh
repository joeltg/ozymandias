#!/usr/bin/env bash

dir=$1
scheme=$2

mkdir -f /etc/schroot/scheme

echo "SETUP_COPYFILES=\"scheme/copyfiles"       >  /etc/schroot/scheme/config
echo "SETUP_NSSDATABASES=\"scheme/nssdatabases" >> /etc/schroot/scheme/config
echo "SETUP_FSTAB=\"scheme/fstab\""             >> /etc/schroot/scheme/config

echo "/etc/resolv.conf" > /etc/schroot/scheme/copyfiles

echo "${dir}/root/bin   /bin    none ro,bind 0 0" >  /etc/schroot/scheme/fstab
echo "${dir}/root/lib   /lib    none ro,bind 0 0" >> /etc/schroot/scheme/fstab
echo "${dir}/root/lib64 /lib64  none ro,bind 0 0" >> /etc/schroot/scheme/fstab
echo "${dir}utils       /utils  none ro,bind 0 0" >> /etc/schroot/scheme/fstab
echo "${scheme}         /scheme none ro,bind 0 0" >> /etc/schroot/scheme/fstab

echo "" > /etc/schroot/scheme/nssdatabases