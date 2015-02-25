This application runs video and face recognition and when triggered, sends an image to 
a server. 

On the faye trigger:

     curl -X POST http://192.168.1.28:9292/faye -H 'Content-Type: application/json' -d '{"channel":"/foo","data":{"trigger":"photo"}}'

it gets a face recognitioned image if there was one in 10 secs, else any image 
(there's always a recent one.

## camcv + faye

Run it like this:

    foreman start

### faye

*Note: faye has a hardcoded IP address currently*

    sudo ./provision node
    sudo gem install foreman
    npm install http faye request
    foreman start

### camcv

see http://planb.nicecupoftea.org/2015/02/06/notes-on-a-tv-as-radio-prototype/

(towards the end) for instructions on how to build on a Pi

### test server

A simple server that runs a faye server, and accepts images and saves them in a folder 
called "public"

Run it like this:

    foreman start


