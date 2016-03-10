Basics
--


provision a card:

    diskutil list
    diskutil unmountDisk /dev/diskn
    sudo dd bs=1m if=~/Downloads/2015-05-05-raspbian-wheezy.img of=/dev/rdiskn

then

    sudo raspi-config
    expand file system, enable camera

reboot

    sudo apt-get remove --purge wolfram-engine -y
    sudo apt-get update && sudo apt-get upgrade -y

---

Broadcast AP
--

install AP

    git clone https://github.com/radiodan/provision.git
    cd provision

replace the contents of steps/wpa/install.sh

with

    sudo apt-get install -y --force-yes dnsmasq && \
    sudo apt-get install -y --force-yes ruby1.9.1-dev hostapd=1:1.0-3+deb7u2 wpasupplicant && \
    sudo gem install --no-ri --no-rdoc wpa_cli_web

then

    sudo mkdir /var/log/radiodan
    sudo LOG_LEVEL=DEBUG ./provision avahi nginx wpa

change name of network

    sudo pico /etc/hostapd/hostapd.conf                                                

change ssid to

    ssid=surveillanceowl

reboot

unplug ethernet if plugged in

connect to surveillanceowl to check it works

plug ethernet in again and ssh in

---

Edit the AP to point at collector
--


edit /etc/nginx/sites-enabled/wpa_cli_web_redirect

    upstream debug {
      server 127.0.0.1:3000 max_fails=0;
    }


edit  /opt/radiodan/adhoc/try_adhoc_network

to remove

    # Do 6 scans over 1 min
    #for i in {1..6}
    #do
    #  echo "Scan $i of 6"
    #  /sbin/wpa_cli scan
    #  /bin/sleep 10
    #done

and

    #echo "Starting wpa-cli-web"
    #/etc/init.d/wpa-cli-web start

remove wpa server from init.d

    sudo update-rc.d wpa_cli_web remove
    sudo update-rc.d wpa-conf-copier remove

edit /opt/radiodan/static/status511.html to say what you want in the captive portal popup

change its name if you like

    sudo pico /etc/hosts
    sudo pico /etc/hostname

---

Install Collector
--

install node

    cd
    cd provision
    sudo LOG_LEVEL=DEBUG ./provision node

install whe

    cd
    git clone https://github.com/libbymiller/whe

    cd whe
    git fetch origin
    git checkout -b surveillanceowl origin/surveillanceowl
    npm install

install supervisord for process management

    sudo update-rc.d dnsmasq defaults
    sudo update-rc.d dnsmasq enable

    sudo apt-get install supervisor -y

    cd
    cd whe
    sudo cp shared/supervisor.conf /etc/init.d/supervisor
    sudo cp collector/collector_supervisor.conf /etc/supervisor/conf.d/collector.conf

receipt printer

Pins (http://wiringpi.com/pins/)

    || Printer wire      || Pi GPIO header number ||
    |  DC IN GND (black) |    -                    |
    |  DC IN VH  (red)   |    -                    |
    |  TTL GND  (black)  |    6                    |
    |  TTL RX  (yellow)  |    8                    |
    |  TTL TX  (green)   |    10                   |

    sudo nano /etc/inittab

  find this line:
      T0:23:respawn:/sbin/getty -L ttyAMA0 115200 vt100

  change the baud rate to 19200:

      T0:23:respawn:/sbin/getty -L ttyAMA0 19200 vt100

    sudo nano /boot/cmdline.txt

  Remove `console=ttyAMA0,115200`



Reboot and test by connecting to the network and opening a browser, making sure you unplug ethernet


---

Install Snapper
--

install node and whe (if you've not done it already)

install node

    cd
    git clone https://github.com/radiodan/provision.git
    cd provision
    sudo LOG_LEVEL=DEBUG ./provision node

install whe

    cd
    git clone https://github.com/libbymiller/whe

    cd whe
    git fetch origin
    git checkout -b surveillanceowl origin/surveillanceowl
    npm install

install prerequisites

    sudo apt-get install libopencv-dev python-opencv -y
    sudo apt-get install libcurl4-openssl-dev -y

install supervisord for process management (if you haven't already)

    sudo apt-get install dnsmasq -y 
    sudo update-rc.d dnsmasq defaults
    sudo update-rc.d dnsmasq enable

    sudo apt-get install supervisor -y


add to supervisor

    cd
    cd whe
    sudo cp shared/supervisor.conf /etc/init.d/supervisor
    sudo cp emitter/snapper/snapper_supervisor.conf /etc/supervisor/conf.d/snapper.conf
    sudo cp emitter/sender/image_sender_supervisor.conf /etc/supervisor/conf.d/image-sender.conf


---

Recompiling snapper
--

(you may not need to)

    sudo apt-get install cmake -y

    cd /opt/vc
    sudo git clone https://github.com/raspberrypi/userland.git
    
    cd /opt/vc/userland 
    sudo chown -R pi:pi .
    sed -i 's/DEFINED CMAKE_TOOLCHAIN_FILE/NOT DEFINED CMAKE_TOOLCHAIN_FILE/g' makefiles/cmake/arm-linux.cmake

    sudo mkdir build
    cd build
    sudo cmake -DCMAKE_BUILD_TYPE=Release ..
    sudo make
    sudo make install

    cd
    cd whe/emitter/snapper/
    cp -r /opt/vc/userland/host_applications/linux/apps/raspicam/*  .

    cp CMakeLists.txt.snapper CMakeLists.txt

    cmake .
    make


---

Install Sniffer
--

install prerequisites

    sudo apt-get install libnl-dev libssl-dev iw 

install airodump-ng

    wget http://download.aircrack-ng.org/aircrack-ng-1.2-beta3.tar.gz
    tar -zxvf aircrack-ng-1.2-beta3.tar.gz
    cd aircrack-ng-1.2-beta3
    make
    sudo make install

    cd
    cd whe

    sudo cp emitter/sniffer/sniffer_supervisor.conf /etc/supervisor/conf.d/sniffer.conf
    sudo cp emitter/sender/metadata_sender_supervisor.conf /etc/supervisor/conf.d/metadata-sender.conf

---

If Collector is a separate machine
--

edit wp_supplicant config

    sudo pico /etc/wpa_supplicant/wpa_supplicant.conf

to

    ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
    update_config=1

    network={
        ssid="surveillanceowl"
        proto=RSN
        key_mgmt=NONE
    }

---

Debugging
--

logs:

    sudo tail -f /var/log/supervisor/*
