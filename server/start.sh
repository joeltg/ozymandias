#!/usr/bin/env bash

chroot=$1
pipe=$2
name=$3

cmd=/scheme/bin/scheme
lib=/scheme/lib
load=/utils/load.scm

schroot --begin-session --chroot ${chroot} --session-name ${name}
exec schroot --run-session --chroot ${name} --directory / -- ${cmd} --library ${lib} --load ${load} --args ${pipe}
