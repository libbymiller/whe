#!/usr/bin/python
# read from stdin
# Usage: sudo airodump-ng mon0 --channel 11 --berlin 2  2>&1  |
# ./send_wifi_data.py 2>&1 >  airodump.log &

import fileinput
import re
import os
import time
import sys
import socket
import json

source = socket.gethostname()

print(source)

script_path = os.path.dirname(os.path.realpath(__file__))

config_file = open(
    os.path.join(script_path, "..", "..", "shared", "config.json"), "r").read()
config = json.loads(config_file)

data_file_path = config["sniffer"]["dataFilename"]

print("Will save data to: " + data_file_path)

to_send_power = {}
to_send_time = {}
to_send_aps = {}
last_time_seen = int(time.time())
last_seen_anything = 100
time_threshold = 10
power_threshold = -51
exclusions = []

# should check for exclusions here

# Then parse the data
for line in fileinput.input():
    pass

    if(re.search('  \w\w\:\w\w', line)):
        try:
            arr = re.split('  ', line)
            # sys.stdout.write( "arr "+ "\t".join(arr))
            power = arr[2].strip()
            aps = ""
            if(re.search('[a-zA-Z]', arr[10])):
                aps = arr[10].strip()
                # sys.stdout.write( "aps "+ aps)

            this_id = str(arr[1].strip())
            tt = int(time.time())

            if(power != "" and int(power) > power_threshold and int(power) != -1):
                if (this_id in exclusions):
                    # print("do nothing, excluded")
                    sys.stdout.write('-')
                else:
                    sys.stdout.write('.')
                    # print("found "+str(this_id)+" power "+str(power))
                    # print("updating last seen anything to "+str(tt))
                    to_send_power[this_id] = str(power)
                    to_send_time[this_id] = str(tt)
                    to_send_aps[this_id] = str(aps)
                    last_seen_anything = tt

            if(len(to_send_power) > 0 and int(time.time()) - last_time_seen > 10):

                # send data every few seconds, to make sure we capture multiple
                # devices
                if(int(time.time()) - last_seen_anything < time_threshold):
                    print("\nsaving data because " + str(time.time() - last_seen_anything))
                    data = []
                    count = 0
                    for item in to_send_time:
                        item_ob = item[0:12] + "XX:XX"
                        list_item = {'source': source, 'id': item_ob, 'time': to_send_time[
                            item], 'power': to_send_power[item], 'aps': to_send_aps[item]}
                        data.append(list_item)
                    data_sorted = sorted(data, key=lambda k: k['power'])
                    all_data = {'data': data_sorted}
                    data_str = json.dumps(all_data)

                    # save the data
                    file_ = open(data_file_path, 'w')
                    file_.write(data_str)
                    file_.close()

                # update time last seen something
                last_time_seen = int(time.time())

        except Exception as e:
            print(e)
            pass
