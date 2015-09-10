import os
import sys
import json
import signal
import time
import math

import httplib

import RPi.GPIO as GPIO

script_path = os.path.dirname(os.path.realpath(__file__))

config_file = open(
    os.path.join(script_path, "..", "..", "shared", "config.json"), "r").read()
config = json.loads(config_file)

host = config['collector']['host']
port = config['collector']['port']

log_distance = config['trigger']['logDistance']

trigger_pin = config['trigger']['triggerPin']
echo_pin = config['trigger']['echoPin']

distance_threshold_cm = config['trigger']['distanceThresholdCm']


def log(msg):
    print(msg)
    sys.stdout.flush()


def setup():
    GPIO.setmode(GPIO.BOARD)

    GPIO.setwarnings(False)

    # point the software to the GPIO pins the sensor is using
    # change these values to the pins you are using
    # GPIO output = the pin that's connected to "Trig" on the sensor
    # GPIO input = the pin that's connected to "Echo" on the sensor
    GPIO.setup(trigger_pin, GPIO.OUT)
    GPIO.setup(echo_pin, GPIO.IN)
    GPIO.output(trigger_pin, GPIO.LOW)

    # found that the sensor can crash if there isn't a delay here
    # no idea why. If you have odd crashing issues, increase delay
    time.sleep(0.3)


def read():

    # libby
    signaloff = time.time()

    # sensor manual says a pulse ength of 10Us will trigger the
    # sensor to transmit 8 cycles of ultrasonic burst at 40kHz and
    # wait for the reflected ultrasonic burst to be received

    # to get a pulse length of 10Us we need to start the pulse, then
    # wait for 10 microseconds, then stop the pulse. This will
    # result in the pulse length being 10Us.

    # start the pulse on the GPIO pin
    # change this value to the pin you are using
    # GPIO output = the pin that's connected to "Trig" on the sensor
    GPIO.output(trigger_pin, True)

    # wait 10 micro seconds (this is 0.00001 seconds) so the pulse
    # length is 10Us as the sensor expects
    time.sleep(0.00001)

    # stop the pulse after the time above has passed
    # change this value to the pin you are using
    # GPIO output = the pin that's connected to "Trig" on the sensor
    GPIO.output(trigger_pin, False)

    # listen to the input pin. 0 means nothing is happening. Once a
    # signal is received the value will be 1 so the while loop
    # stops and has the last recorded time the signal was 0
    # change this value to the pin you are using
    # GPIO input = the pin that's connected to "Echo" on the sensor
    while GPIO.input(echo_pin) == 0:
        signaloff = time.time()

    # listen to the input pin. Once a signal is received, record the
    # time the signal came through
    # change this value to the pin you are using
    # GPIO input = the pin that's connected to "Echo" on the sensor
    while GPIO.input(echo_pin) == 1:
        signalon = time.time()

    # work out the difference in the two recorded times above to
    # calculate the distance of an object in front of the sensor
    timepassed = signalon - signaloff

    # we now have our distance but it's not in a useful unit of
    # measurement. So now we convert this distance into centimetres
    distance = timepassed * 17000

    # return the distance of an object in front of the sensor in cm
    return distance


def teardown():
    log('Cleaning up GPIO...')
    GPIO.cleanup()


def send_trigger_message():
    log("Send trigger message")
    msg = '{"channel":"/trigger","data":{}}'
    headers = {"Content-type": "application/json"}

    try:
        conn = httplib.HTTPConnection(host, port)
        conn.request("POST", "/faye", msg, headers)
        response = conn.getresponse()
        log(str(response.status) + " " + response.reason)
    except httplib.HTTPException:
        log("Error making HTTP request")
    finally:
        conn.close()


def handleSigTERM():
    teardown()
    log('...exit')
    sys.exit()


signal.signal(signal.SIGTERM, handleSigTERM)

setup()

has_triggered = False
last_distance = 0

# Main loop
while True:
    distance = math.ceil(read())

    # Log if distance has changed
    if log_distance and (distance != last_distance):
        log(distance)
        last_distance = distance

    # If within distance threshold ...
    if distance < distance_threshold_cm:
        log("Within distance threshold")
    # ... and not in triggered state
    if not has_triggered:
        log("Triggering")
        send_trigger_message()
        has_triggered = True
    # else outside of distance threshold and in triggered state
    elif has_triggered:
        log("Outside of distance threshold...reset")
        has_triggered = False

    time.sleep(0.5)
