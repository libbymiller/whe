Collector
--

provision a card:

    diskutil list
    diskutil unmountDisk /dev/diskn
    sudo dd bs=1m if=~/Downloads/2015-01-31-raspbian.img of=/dev/diskn

then

    sudo raspi-config
    expand file system

reboot

    sudo apt-get update && sudo apt-get upgrade -y

install avahi and node

    git clone https://github.com/radiodan/provision
    cd provision
    sudo ./provision avahi node

change its name to "collector"

    sudo pico /etc/hosts
    sudo pico /etc/hostname

    sudo gem install foreman --no-ri --no-rdoc

install whe

    cd
    git clone https://github.com/libbymiller/whe
    cd whe
    npm install

try it

    foreman start -p 3000 -f collector/Procfile

stop it

install supervisord for process management

    sudo apt-get install supervisor -y

    sudo cp shared/supervisor.conf /etc/init.d/supervisor
    sudo cp collector/collector_supervisor.conf /etc/supervisor/conf.d/collector.conf

    # Remove existing scripts
    sudo update-rc.d collector remove

create RAM disks for relevant paths:

  cat shared/fstab >> /etc/fstab

restart, then run:

    sudo supervisorctl reload


---

Snapper
--

provision a card:

    diskutil list
    diskutil unmountDisk /dev/diskn
    sudo dd bs=1m if=~/Downloads/2015-01-31-raspbian.img of=/dev/diskn


    sudo raspi-config
    expand file system
    enable camera

reboot

    sudo apt-get remove --purge wolfram-engine
    sudo apt-get update && sudo apt-get upgrade -y


install avahi and node

    git clone https://github.com/radiodan/provision
    cd provision
    sudo ./provision avahi node

change its name to "snapper1"

    sudo pico /etc/hosts
    sudo pico /etc/hostname

install foreman in case you want to test it locally

    sudo gem install foreman --no-ri --no-rdoc

install whe

    git clone https://github.com/libbymiller/whe
    cd whe
    npm install


    sudo apt-get install libopencv-dev python-opencv

    cd
    cd whe/emitter

test it if you like

    foreman start

kill it

install supervisord for process management

    sudo apt-get install supervisor

    sudo cp emitter/snapper/snapper_supervisor.conf /etc/supervisor/conf.d/snapper.conf

    sudo cp emitter/sender/image_sender_supervisor.conf /etc/supervisor/conf.d/image-sender.conf

    # Remove existing scripts
    sudo update-rc.d snapper remove
    sudo update-rc.d image-sender remove

create RAM disks for relevant paths:

  cat shared/fstab >> /etc/fstab

restart, then run:

    sudo supervisorctl reload

----

sniffer
--

provision a card:

    diskutil list
    diskutil unmountDisk /dev/diskn
    sudo dd bs=1m if=~/Downloads/2015-01-31-raspbian.img of=/dev/diskn

    sudo raspi-config

expand file system

reboot

    sudo apt-get remove --purge wolfram-engine
    sudo apt-get update && sudo apt-get upgrade -y

install avahi and node

    git clone https://github.com/radiodan/provision
    cd provision
    sudo ./provision avahi node

change its name to "sniffer"

    sudo pico /etc/hosts
    sudo pico /etc/hostname

    sudo gem install foreman --no-ri --no-rdoc

    cd
    git clone https://github.com/libbymiller/whe
    cd whe
    npm install

install prerequisites

    sudo apt-get install libnl-dev libssl-dev iw avahi-daemon ntpdate

install airodump-ng

    wget http://download.aircrack-ng.org/aircrack-ng-1.2-beta3.tar.gz
    tar -zxvf aircrack-ng-1.2-beta3.tar.gz
    cd aircrack-ng-1.2-beta3
    make
    sudo make install

install supervisord for process management

    sudo apt-get install supervisor -y

    sudo cp shared/supervisor.conf /etc/init.d/supervisor
    sudo cp emitter/sniffer/sniffer_supervisor.conf /etc/supervisor/conf.d/sniffer.conf
    sudo cp emitter/sender/metadata_sender_supervisor.conf /etc/supervisor/conf.d/metadata-sender.conf


create RAM disks for relevant paths:

  cat shared/fstab >> /etc/fstab

restart, then run:

    sudo supervisorctl reload

----

Trigger
--

provision a card:

    diskutil list
    diskutil unmountDisk /dev/diskn
    sudo dd bs=1m if=~/Downloads/2015-01-31-raspbian.img of=/dev/diskn


    sudo raspi-config
expand file system

reboot

    sudo apt-get update && sudo apt-get upgrade -y

change its name to "trigger"

    sudo pico /etc/hosts
    sudo pico /etc/hostname

install avahi

    git clone https://github.com/radiodan/provision
    cd provision
    sudo ./provision avahi

install whe

    git clone https://github.com/libbymiller/whe
    cd whe

install supervisord for process management

    sudo apt-get install supervisor -y

    sudo cp shared/supervisor.conf /etc/init.d/supervisor
    sudo cp emitter/trigger/trigger_supervisor.conf /etc/supervisor/conf.d/trigger.conf

create RAM disks for relevant paths:

  cat shared/fstab >> /etc/fstab

restart, then run:

    sudo supervisorctl reload
