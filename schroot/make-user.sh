#!/usr/bin/env bash

path=$1
user=$2
owner=$3

cat <<FOO >> /etc/schroot/chroot.d/scheme.conf

[scheme-${user}]
type=directory
directory=${path}/jail/${user}
users=${owner}
root-groups=root
profile=scheme
shell=/bin/bash

FOO