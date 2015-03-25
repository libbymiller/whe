#!/bin/sh
#
# Delete all .jpg images older then 15 mins in /tmp

find /tmp -type f -name '*.jpg' -mmin +15 -execdir rm -v {} \;