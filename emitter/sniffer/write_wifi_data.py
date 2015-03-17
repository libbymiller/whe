#!/usr/bin/python
# read from stdin
# Usage: sudo airodump-ng mon0 --channel 11 --berlin 2  2>&1  | ./send_wifi_data.py 2>&1 >  airodump.log &

import fileinput
import re
import subprocess
import os
import glob
import time
import sys
import socket
import urllib
import json

# Log to stdout
# TODO: Need to flush buffer for instant logging?
def log(msg):
    print msg
    sys.stdout.flush()

# Return path to save data to from config.json
def get_data_file_path():
    script_path = os.path.dirname(os.path.realpath(__file__))

    config_file = open(os.path.join(script_path, "..", "..", "shared", "config.json"), "r").read()
    config = json.loads(config_file)

    return config["sniffer"]["dataFilename"]

# Given line input array, find and return APs
def get_aps_from_arr(arr):
    aps = ""

    if( re.search('[a-zA-Z]', arr[10]) ):
        aps = arr[10].strip()

    return aps

# Sort data by power and save to path
def sort_and_save_data(data, file_path):
    # Sort by power
    data_sorted = sorted(data.values(), key=lambda k: k['power'])
    all_data = {'data': data_sorted}
    data_str = json.dumps(all_data)

    # save the data
    output_file = open(file_path, 'w')
    output_file.write(data_str)
    output_file.close()


source = socket.gethostname()
log("Source: " + source)

data_file_path = get_data_file_path()
log("Will save data to: " + data_file_path)

# Indexed by mac address as 'id'
# {
#    'source': source,
#    'id'    : item,
#    'time'  : to_send_time[item],
#    'power' : to_send_power[item],
#    'aps'   : to_send_aps[item]
# }
data = {}

last_time_seen = int(time.time())
last_seen_anything = 100
time_threshold = 10
power_threshold = -51
exclusions = []

# Parse data from stdin
for line in fileinput.input():
    pass

    # Identify line
    if(re.search('  \w\w\:\w\w', line)):
        try:
            arr = re.split('  ',line)
        except Exception, e:
            log("Error splitting line", line)
            print e
            pass

        try:
            power = arr[2].strip()
            aps   = get_aps_from_arr(arr)
            mac   = str(arr[1].strip())
        except Exception, e:
            log("Error getting power, aps and MAC address")
            print e
            pass

        try:
            # Current time for this loop
            current_loop_time = int(time.time())
            # If power value is correct and within threshold
            has_power = power != "" and int(power) > power_threshold and int(power) != -1
        except Exception, e:
            log("Error calculating if how_power or current_loop_time")
            print e
            pass

        try:
            if( has_power ):
                if (mac in exclusions):
                    # MAC is excluded
                    log('-')
                else:
                    # Included
                    log('.')

                    # New
                    if( mac not in data ):
                        data[mac] = {}

                    data[mac]['id']     = mac
                    data[mac]['source'] = source
                    data[mac]['power']  = str(power)
                    data[mac]['time']   = str(current_loop_time)
                    data[mac]['aps']    = str(aps)

                    last_seen_anything = current_loop_time
        except Exception, e:
            log("Error putting data into data structure for mac" + mac)
            print e
            pass

        try:
            have_items_to_send   = len(data) > 0
            time_passed_interval = int(time.time()) - last_time_seen

            if(have_items_to_send and time_passed_interval > 10):

                # send data every few seconds, to make sure we capture multiple devices
                time_since_last_seen_something = int(time.time()) - last_seen_anything
                if( time_since_last_seen_something < time_threshold ):
                    log("Saving data because time_since_last_seen_something: " + str(time_since_last_seen_something))
                    sort_and_save_data(data, data_file_path)

                # update time last seen something
                last_time_seen = int(time.time())

        except Exception, e:
            log("Error deciding time interval for saving data or saving data to file")
            print e
            pass
