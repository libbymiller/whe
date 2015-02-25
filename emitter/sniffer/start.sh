#/bin/sh

sudo killall airodump-ng

# start up airmon and airodump

sudo airmon-ng check kill;
sudo airmon-ng start wlan0;

# sort out the networking to attach to known wifi networks on the other card
#sudo  wpa_supplicant -B -iwlan1 -c/etc/wpa_supplicant.conf -Dwext && dhclient wlan1;

sudo airodump-ng mon0 --channel 11 --berlin 2  2>&1  | /home/pi/whe/emitter/sniffer/write_wifi_data.py 

