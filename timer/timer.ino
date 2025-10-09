#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_LEDBackpack.h>

Adafruit_7segment matrix = Adafruit_7segment();
Adafruit_7segment matrix2 = Adafruit_7segment();

unsigned long startMillis;
unsigned long elapsedMillis = 0;
unsigned long racer1Time = 0;
unsigned long racer2Time = 0;

int hallSensor = 7; // Hall effect sensor signals start of race
int led = 13; // LED displays when hall effect sensor is triggered

bool started = false;
bool racer1Finished = false;
bool racer2Finished = false;

String serialBuffer = "";

void displayTime(Adafruit_7segment &display, unsigned long timeValue) {
  // timeValue is in hundredths of a second
  // Format: SS.TH (seconds.tenths+hundredths)
  // Display up to 99.99 seconds
  unsigned long tensOfSeconds = (timeValue / 1000) % 10;
  unsigned long seconds = (timeValue / 100) % 10;
  unsigned long tenths = (timeValue / 10) % 10;
  unsigned long hundredths = timeValue % 10;

  display.writeDigitNum(0, tensOfSeconds);
  display.writeDigitNum(1, seconds);
  display.writeDigitRaw(2, 0x02); // colon as separator (both dots)
  display.writeDigitNum(3, tenths);
  display.writeDigitNum(4, hundredths);
  display.writeDisplay();
}

void setup() {
  Serial.begin(9600);
  Serial.println("setup timer");
  matrix.begin(0x74);  // Address jumper set to 4
  matrix2.begin(0x75); // Address jumper set to 5

  pinMode(led, OUTPUT); //define LED as a output port
  pinMode(hallSensor, INPUT_PULLUP); //define hall sensor with internal pullup

  displayTime(matrix, 1111);
  displayTime(matrix2, 2222);
}

void loop() {
  // Check serial port for finish times from camera
  // Expected format: "1:XXXX" or "2:XXXX" where XXXX is time in hundredths
  // Or "0" to reset
  if (Serial.available() > 0) {
    char inByte = Serial.read();

    if (inByte == '\n' || inByte == '\r') {
      if (serialBuffer.length() > 0) {
        if (serialBuffer == "0") {
          // Reset for next race
          started = false;
          elapsedMillis = 0;
          racer1Finished = false;
          racer2Finished = false;
          racer1Time = 0;
          racer2Time = 0;
          matrix.clear();
          matrix.writeDisplay();
          matrix2.clear();
          matrix2.writeDisplay();
        } else if (serialBuffer.startsWith("1:")) {
          // Racer 1 finished, parse time
          racer1Time = serialBuffer.substring(2).toInt();
          racer1Finished = true;
        } else if (serialBuffer.startsWith("2:")) {
          // Racer 2 finished, parse time
          racer2Time = serialBuffer.substring(2).toInt();
          racer2Finished = true;
        }
        serialBuffer = "";
      }
    } else {
      serialBuffer += inByte;
    }
  }

  // Hall effect sensor on switch starts race
  if (digitalRead(hallSensor) == LOW) {
    if (!started) {
      Serial.println("START:CLOSED"); // Send message to camera system
      started = true;
      startMillis = millis();
    }
    digitalWrite(led, HIGH);
  } else {
    digitalWrite(led, LOW);
  }

  // use internal time once race has started
  if (started) {
    elapsedMillis = (millis() - startMillis) / 10; // display hundredths of a second
  }

  // Control LED displays
  if (racer1Finished) {
    // Display official finish time from camera
    displayTime(matrix, racer1Time);
  } else if (started) {
    // Display elapsed time
    displayTime(matrix, elapsedMillis);
  }

  if (racer2Finished) {
    // Display official finish time from camera
    displayTime(matrix2, racer2Time);
  } else if (started) {
    // Display elapsed time
    displayTime(matrix2, elapsedMillis);
  }

  delay(10);

}
