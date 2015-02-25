This application runs airodump, saves it to a file, and then sends metadata to a 
server when triggered va faye.

On the faye trigger:

     curl -X POST http://192.168.1.28:9292/faye -H 'Content-Type: application/json' -d '{"channel":"/foo","data":{"trigger":"photo"}}'

## airodump + faye

Run it like this:

    foreman start

### faye

*Note: faye has a hardcoded IP address currently*

    sudo ./provision node
    sudo gem install foreman
    npm install http faye request
    foreman start

### airodump

    ./start_wifi_saver.sh

(assumes the correct wifi inforation is in /etc/wpa_supplicant.conf )

