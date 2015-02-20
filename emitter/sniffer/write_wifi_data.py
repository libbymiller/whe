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

source = socket.gethostname()
            
print source

to_send_power = {}
to_send_time = {}
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
        arr = re.split('  ',line)
        power = arr[2].strip()
        aps = ""
        if(re.search('[a-zA-Z]', arr[10])):
          aps = arr[10].strip()

        this_id = str(arr[1].strip())
        tt = int(time.time())
        if(power!="" and int(power) > power_threshold and int(power)!=-1):

          if (this_id in exclusions):
            #print "do nothing, excluded"
            sys.stdout.write('-')
          else:
            sys.stdout.write('.')
            #print "found "+str(this_id)+" power "+str(power)
            #print "updating last seen anything to "+str(tt)         
            to_send_power[this_id] = str(power)
            to_send_time[this_id] = str(tt)
            last_seen_anything = tt

        if(len(to_send_power) > 0 and int(time.time()) - last_time_seen > 10):

          # send data every few seconds, to make sure we capture multiple devices
          if(int(time.time()) - last_seen_anything < time_threshold):
            print "saving data because "+str(time.time() - last_seen_anything)
            data_str = "["
            count = 0
            for item in to_send_time:           
             item_sm = item[0:7]
             item_sm = item_sm.replace(":","-")
             #find the company from the oui file
             cmd4 = "grep "+item_sm+" /home/pi/mozfest/oui_small.txt"
             print cmd4
             company = "unknown"
             try:
               company_str = subprocess.check_output("grep '"+item_sm+"' /home/pi/mozfest/oui_small.txt", shell=True)
               arr2 = re.split('\t',company_str)
               company = arr2[2].rstrip()
               company.replace('\n','')
               company.replace('\r','')
             except Exception, f:
              print f
              pass

             data_str = data_str + "{\"source\":\""+source+"\",\"id\": \""+item+"\", \"time\": \""+to_send_time[item]+"\", \"power\": \""+to_send_power[item]+"\", \"company\": \""+company+"\", \"aps\":\""+aps+"\"}"

             if(count < len(to_send_time)-1):
                data_str = data_str +","
             count=count+1
            data_str = data_str+"]"

            # save the data
            file_ = open('data.json', 'w')
            file_.write("{\"data\": "+data_str+"}")
            file_.close()

          # update time last seen something
          last_time_seen = int(time.time())

      except Exception, e:
        print e
        pass
