#/bin/sh

# find hostname and ip
host=$(hostname)
foo=$(hostname -I)

# start up airmon and airodump

sudo mv /home/pi/mozfest/airodump.log /home/pi/mozfest/airodump.log.1

sudo airmon-ng check kill;
sudo airmon-ng start wlan0;
sudo airodump-ng mon0 --channel 11 --berlin 2  2>&1  | /home/pi/mozfest/write_wifi_data.py 2>&1 >  /home/pi/mozfest/airodump.log &

# sort out the networking to attach to known wifi networks on the other card
sudo  wpa_supplicant -B -iwlan1 -c/etc/wpa_supplicant.conf -Dwext && dhclient wlan1;
sudo dhclient wlan1;

