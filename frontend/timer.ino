#include <Adafruit_NeoPixel.h>

// Don't start on pin 1 :|
#define DIGIT1_PIN  5  // Digit on right, hundredths of sec
#define DIGIT2_PIN  4  // tenths of sec
#define DIGIT3_PIN  3  // seconds with decimal place
#define DIGIT4_PIN  2  // tens of seconds

#define DIGIT5_PIN  9  // Digit on right, hundredths of sec
#define DIGIT6_PIN  8  // tenths of sec
#define DIGIT7_PIN  7  // seconds with decimal place
#define DIGIT8_PIN  6  // tens of seconds

#define HALL_SENSOR_PIN 12  // Digital pin for hall sensor (using digital read)

#define NUMPIXELS 29 // 4 pixels on 7 segment display + 1 decimal point

Adafruit_NeoPixel digit1(NUMPIXELS, DIGIT1_PIN, NEO_GRB + NEO_KHZ800);
Adafruit_NeoPixel digit2(NUMPIXELS, DIGIT2_PIN, NEO_GRB + NEO_KHZ800);
Adafruit_NeoPixel digit3(NUMPIXELS, DIGIT3_PIN, NEO_GRB + NEO_KHZ800);
Adafruit_NeoPixel digit4(NUMPIXELS, DIGIT4_PIN, NEO_GRB + NEO_KHZ800);

Adafruit_NeoPixel digit5(NUMPIXELS, DIGIT5_PIN, NEO_GRB + NEO_KHZ800);
Adafruit_NeoPixel digit6(NUMPIXELS, DIGIT6_PIN, NEO_GRB + NEO_KHZ800);
Adafruit_NeoPixel digit7(NUMPIXELS, DIGIT7_PIN, NEO_GRB + NEO_KHZ800);
Adafruit_NeoPixel digit8(NUMPIXELS, DIGIT8_PIN, NEO_GRB + NEO_KHZ800);

uint32_t color = digit1.Color(150, 0, 0); // Red

// Hall sensor variables
bool lastHallState = false;
bool currentHallState = false;

// Debug mode
bool debugMode = false;
unsigned long lastDebugPrint = 0;

// Current display values
uint8_t display1Values[4] = {0, 0, 0, 0}; // tens, ones, tenths, hundredths
uint8_t display2Values[4] = {0, 0, 0, 0};

void setup() {
  Serial.begin(9600);
  Serial.println("Ready for timing");
  
  // Configure hall sensor pin with pull-up resistor
  pinMode(HALL_SENSOR_PIN, INPUT_PULLUP);
  
  digit1.begin();
  digit2.begin();
  digit3.begin();
  digit4.begin();
  digit5.begin();
  digit6.begin();
  digit7.begin();
  digit8.begin();

  digit1.show(); // Initialize all pixels to 'off'
  digit2.show();
  digit3.show();
  digit4.show();
  digit5.show();
  digit6.show();
  digit7.show();
  digit8.show();
  
  // Test pattern on startup - show "1234" on first display
  Serial.println("Testing displays - showing 1234...");
  displayDigit(digit4, 1);
  displayDigit(digit3, 2);
  displayDigit(digit2, 3);
  displayDigit(digit1, 4);
  delay(2000);
  Serial.println("Test complete. Starting normal operation.");
}

// Define the segments for a seven-segment display
// Each number in this array represents which segments to light up (A to G)
// 4 LEDs per segment: [A, B, C, D, E, F, G] => [0-3, 4-7, 8-11, 12-15, 16-19, 20-23, 24-27]
const uint8_t segments[10][7] = {
  {1, 1, 1, 1, 1, 1, 0}, // 0
  {0, 0, 1, 1, 0, 0, 0}, // 1
  {0, 1, 1, 0, 1, 1, 1}, // 2
  {0, 1, 1, 1, 1, 0, 1}, // 3
  {1, 0, 1, 1, 0, 0, 1}, // 4
  {1, 1, 0, 1, 1, 0, 1}, // 5
  {1, 1, 0, 1, 1, 1, 1}, // 6
  {0, 1, 1, 1, 0, 0, 0}, // 7
  {1, 1, 1, 1, 1, 1, 1}, // 8
  {1, 1, 1, 1, 0, 0, 1}  // 9
};

// Function to display a digit on a 7-segment display
void displayDigit(Adafruit_NeoPixel& digit, uint8_t number) {
  digit.clear();
  
  for (int segment = 0; segment < 7; segment++) {
    if (segments[number][segment]) {
      for (int i = 0; i < 4; i++) { // 4 pixels per segment
        digit.setPixelColor(segment * 4 + i, color);
      }
    }
  }
  digit.setPixelColor(28, color); // decimal point is always on
  digit.show();
}

// Function to read hall sensor state
bool readHallSensor() {
  // Digital read: LOW = magnet detected (closed), HIGH = no magnet (open)
  return digitalRead(HALL_SENSOR_PIN);
}

// Function to send status response
void sendStatus() {
  Serial.print("STATUS:");
  Serial.print(currentHallState ? "OPEN" : "CLOSED");
  Serial.print(",DISPLAY1:");
  Serial.print(display1Values[0]);
  Serial.print(display1Values[1]);
  Serial.print(display1Values[2]);
  Serial.print(display1Values[3]);
  Serial.print(",DISPLAY2:");
  Serial.print(display2Values[0]);
  Serial.print(display2Values[1]);
  Serial.print(display2Values[2]);
  Serial.println(display2Values[3]);
}
int i = 0;
void loop() {
  // Read hall sensor state (digital)
  currentHallState = readHallSensor();
  
  // Debug output every 500ms if enabled
  if (debugMode && (millis() - lastDebugPrint > 500)) {
    Serial.print("DEBUG: Digital=");
    Serial.print(currentHallState ? "HIGH" : "LOW");
    Serial.print(" State=");
    Serial.println(currentHallState ? "OPEN" : "CLOSED");
    lastDebugPrint = millis();
  }
  
  // Check if hall sensor state has changed
  if (currentHallState != lastHallState) {
    Serial.print("STATE CHANGE: ");
    if (currentHallState) {
      Serial.print("START:OPEN");
    } else {
      Serial.print("START:CLOSED");
    }
    Serial.println("");
    lastHallState = currentHallState;
  }
  
  // Check for serial commands
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    
    if (command == "STATUS") {
      sendStatus();
    } else if (command == "DEBUG") {
      debugMode = !debugMode;
      Serial.print("Debug mode: ");
      Serial.println(debugMode ? "ON" : "OFF");
      if (debugMode) {
        Serial.println("Showing sensor readings every 500ms...");
      }
    } else if (command == "HELP") {
      Serial.println("Commands:");
      Serial.println("  STATUS - Get current state and display values");
      Serial.println("  DEBUG  - Toggle debug output");
      Serial.println("  HELP   - Show this help");
      Serial.println("  [track]:[time] - Set time for specific track (e.g., 1:12.34)");
      Serial.println("  [8 digits] - Set display values (legacy format)");
    } else if (command.indexOf(':') > 0) {
      // Parse track:time format (e.g., "1:12.34" or "2:5.67")
      int colonIndex = command.indexOf(':');
      String trackStr = command.substring(0, colonIndex);
      String timeStr = command.substring(colonIndex + 1);
      
      int trackNumber = trackStr.toInt();
      
      // Validate track number
      if (trackNumber < 1 || trackNumber > 2) {
        Serial.println("ERROR: Track number must be 1 or 2");
        return;
      }
      
      // Parse time string (format: XX.XX)
      int dotIndex = timeStr.indexOf('.');
      if (dotIndex == -1) {
        Serial.println("ERROR: Time format must include decimal point (e.g., 12.34)");
        return;
      }
      
      String secondsStr = timeStr.substring(0, dotIndex);
      String decimalStr = timeStr.substring(dotIndex + 1);
      
      // Validate decimal part length
      if (decimalStr.length() != 2) {
        Serial.println("ERROR: Decimal part must be exactly 2 digits");
        return;
      }
      
      int seconds = secondsStr.toInt();
      int tenths = decimalStr.charAt(0) - '0';
      int hundredths = decimalStr.charAt(1) - '0';
      
      // Validate values
      if (seconds < 0 || seconds > 99 || tenths < 0 || tenths > 9 || hundredths < 0 || hundredths > 9) {
        Serial.println("ERROR: Invalid time values");
        return;
      }
      
      // Convert to display format
      int tens = seconds / 10;
      int ones = seconds % 10;
      
      if (trackNumber == 1) {
        display1Values[0] = tens;
        display1Values[1] = ones;
        display1Values[2] = tenths;
        display1Values[3] = hundredths;
        
        // Update display 1
        displayDigit(digit4, display1Values[0]); // tens of seconds
        displayDigit(digit3, display1Values[1]); // seconds
        displayDigit(digit2, display1Values[2]); // tenths
        displayDigit(digit1, display1Values[3]); // hundredths
        
        Serial.print("Track 1 set to: ");
        Serial.print(tens);
        Serial.print(ones);
        Serial.print(".");
        Serial.print(tenths);
        Serial.println(hundredths);
      } else {
        display2Values[0] = tens;
        display2Values[1] = ones;
        display2Values[2] = tenths;
        display2Values[3] = hundredths;
        
        // Update display 2
        displayDigit(digit8, display2Values[0]); // tens of seconds
        displayDigit(digit7, display2Values[1]); // seconds
        displayDigit(digit6, display2Values[2]); // tenths
        displayDigit(digit5, display2Values[3]); // hundredths
        
        Serial.print("Track 2 set to: ");
        Serial.print(tens);
        Serial.print(ones);
        Serial.print(".");
        Serial.print(tenths);
        Serial.println(hundredths);
      }
    } else if (command.length() == 8) {
      // Parse display values (format: XXXXXXXX where X is 0-9) - legacy format
      for (int i = 0; i < 4; i++) {
        display1Values[i] = command.charAt(i) - '0';
        display2Values[i] = command.charAt(i + 4) - '0';
      }
      
      // Update displays
      displayDigit(digit4, display1Values[0]); // tens of seconds
      displayDigit(digit3, display1Values[1]); // seconds
      displayDigit(digit2, display1Values[2]); // tenths
      displayDigit(digit1, display1Values[3]); // hundredths
      
      displayDigit(digit8, display2Values[0]); // tens of seconds
      displayDigit(digit7, display2Values[1]); // seconds
      displayDigit(digit6, display2Values[2]); // tenths
      displayDigit(digit5, display2Values[3]); // hundredths
    }
  }
  
  delay(10);  // Small delay for stability
}
