#!/usr/bin/env bash

user=$1
path=$2
owner=$3

cat <<FOO >> /etc/schroot/chroot.d/scheme.conf

[scheme-${user}]
type=directory
directory=${path}
users=${owner}
root-groups=root
profile=scheme
shell=/bin/bash

FOO