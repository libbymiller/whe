#!/bin/sh
### BEGIN INIT INFO
# Provides:          sniffer
# Required-Start:    $remote_fs $syslog
# Required-Stop:     $remote_fs $syslog
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: Wifi Sniffer
# Description:       Uses Airmon and Airodump to track wifi mac addresses
### END INIT INFO
# Quick start-stop-daemon example, derived from Debian /etc/init.d/ssh
set -e

export PATH=$PATH:/usr/local/bin
export LOG_LEVEL=debug

NAME=sniffer

export PATH="${PATH:+$PATH:}/usr/sbin:/sbin"

case "$1" in
  start)
    echo -n "Starting: "$NAME
    /bin/sh /home/pi/mozfest/start.sh > /var/log/$NAME_start.log 2>&1
    echo "."
    ;;
  stop)
    echo -n "Stopping: "$NAME
    killall airodump-ng
    echo "."
    ;;
  *)
    echo "Usage: "$1" {start|stop}"
    exit 1
esac

exit 0
