# SPDX-FileCopyrightText: 2021 ladyada for Adafruit Industries
# SPDX-License-Identifier: MIT

# Basic example of setting digits on a LED segment display.
# This example and library is meant to work with Adafruit CircuitPython API.
# Author: Tony DiCola
# License: Public Domain

import time
from os import getenv

import adafruit_connection_manager
import wifi

import adafruit_minimqtt.adafruit_minimqtt as MQTT

# Import all board pins.
import board
import busio

# Import the HT16K33 LED segment module.
from adafruit_ht16k33 import segments

# Create the I2C interface.
i2c = busio.I2C(board.SCL, board.SDA)

# Create the LED segment class.
# This creates a 7 segment 4 character display:
display1 = segments.Seg7x4(i2c, address=0x70)
display2 = segments.Seg7x4(i2c, address=0x71)
display3 = segments.Seg7x4(i2c, address=0x72)
display4 = segments.Seg7x4(i2c, address=0x73)
display5 = segments.Seg7x4(i2c, address=0x74)
display6 = segments.Seg7x4(i2c, address=0x75)

display1.brightness = 1
display2.brightness = 1
display3.brightness = 1
display4.brightness = 1
display5.brightness = 1
display6.brightness = 1

# Clear the display.
display1.fill(0)
display2.fill(0)
display3.fill(0)
display4.fill(0)
display5.fill(0)
display6.fill(0)

time.sleep(1)

# Can just print a number
display1.print(1111)
display2.print(2222)
display3.print(3333)
display4.print(4444)
display5.print(5555)
display6.print(6666)

time.sleep(2)

ssid = getenv("CIRCUITPY_WIFI_SSID")
password = getenv("CIRCUITPY_WIFI_PASSWORD")
broker = "192.168.1.10"

print(f"Connecting to {ssid}")
wifi.radio.connect(ssid, password)
print(f"Connected to {ssid}!")
### Feeds ###

ondeck_feed = "ondeck"


# Define callback methods which are called when events occur
def connected(client, userdata, flags, rc):
    # This function will be called when the client is connected
    # successfully to the broker.
    print(f"Connected to MQTT! Listening for topic changes on {ondeck_feed}")
    # Subscribe to all changes on the onoff_feed.
    client.subscribe(ondeck_feed)


def disconnected(client, userdata, rc):
    # This method is called when the client is disconnected
    print("Disconnected from MQTT")


def message(client, topic, message):
    # This method is called when a topic the client is subscribed to
    # has a new message.

    if topic == "ondeck":
        if message == "GOGO":
            display1.print("GOGO")
            display2.print("GOGO")
            display3.print("GOGO")
            display4.print("GOGO")
            display5.print("GOGO")
            display6.print("GOGO")
        else:
            parts = message.split(",")
            
            # Clear all displays first
            display1.fill(0)
            display2.fill(0)
            display3.fill(0)
            display4.fill(0)
            display5.fill(0)
            display6.fill(0)
            
            # Get left and right track data
            left_racers = parts[0] if len(parts) > 0 else ""
            right_racers = parts[1] if len(parts) > 1 else ""
            
            # Helper function to display racer or placeholder
            def show_racer(display, racer_str, placeholder=""):
                racer = racer_str.strip()
                if racer and racer != "" and racer != "----":
                    try:
                        # Try to display as number if possible
                        display.print(int(racer))
                    except:
                        # Otherwise display as string
                        display.print(racer)
                elif racer == "----":
                    # Show dashes for empty lane
                    display.print("----")
                elif placeholder:
                    # Show placeholder if provided
                    display.print(placeholder)
                # Otherwise leave blank (already cleared)
            
            # Display current heat (first 4 chars of each string)
            if len(left_racers) >= 4:
                show_racer(display1, left_racers[0:4])
            
            if len(right_racers) >= 4:
                show_racer(display2, right_racers[0:4])
            
            # Display next heat (chars 4-8)
            if len(left_racers) >= 8:
                show_racer(display3, left_racers[4:8])
                
            if len(right_racers) >= 8:
                show_racer(display4, right_racers[4:8])
            
            # Display heat after next (chars 8-12)
            if len(left_racers) >= 12:
                show_racer(display5, left_racers[8:12])
                
            if len(right_racers) >= 12:
                show_racer(display6, right_racers[8:12])

    print(f"New message on topic {topic}: {message}")


# Create a socket pool and ssl_context
pool = adafruit_connection_manager.get_radio_socketpool(wifi.radio)
ssl_context = adafruit_connection_manager.get_radio_ssl_context(wifi.radio)

mqtt_client = MQTT.MQTT(
    broker=broker,
    socket_pool=pool,
    ssl_context=ssl_context,
)

mqtt_client.on_connect = connected
mqtt_client.on_disconnect = disconnected
mqtt_client.on_message = message

print("Connecting to MQTT...")
mqtt_client.connect()

while True:
    # Poll the message queue
    mqtt_client.loop(timeout=1)
    time.sleep(0.1)
