#!/usr/bin/env python
#-- coding: utf-8 --

## IMPORTANT !!
## If this script is run from console and outputs an error "RuntimeError: Not running on a RPi!", you need to do the following:
## check the following rights:
## ls -l/dev/gpiomem
## if the rights are not like:  crw-rw---- 1 root gpio <some date, time> /dev/gpiomem
## do this:
## sudo chown root.gpio /dev/gpiomem
## sudo chmod g+rw /dev/gpiomem
##
## If after reboot the rights are reset, apply this to crontab with `sudo crontab -e`:
## @reboot sudo chown root.gpio /dev/gpiomem
## @reboot sudo chmod g+rw /dev/gpiomem

# Import necessary libraries
import RPi.GPIO as GPIO
import time, argparse

# Initialize variables
pin = None

# Get arguments
parser = argparse.ArgumentParser()

parser.add_argument("pin", type=int, help="The pin of the PIR sensor.")

args = parser.parse_args()

pin = args.pin

# Configure GPIO
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)
GPIO.setup(pin, GPIO.IN)

# Indicate PIR sensor start
print("PIR_START")

# Script
try:
	time.sleep(2) # Sensor Stabilization Delay (2 seconds)

	# Infinite loop
	while True:
		if GPIO.input(pin):
			print("USER_PRESENCE")
			time.sleep(5) # Delay to avoid multiple detections (5 seconds)

		time.sleep(1) # Loop delay (1 second)


finally:
	GPIO.cleanup()
