import type { Race } from "./types";

import mqtt from "mqtt";
import { config } from "dotenv";

// Load environment variables from .env file
config();

// Configuration
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || "mqtt://localhost";
const API_BASE_URL = process.env.API_BASE_URL || "https://brickrace.netlify.app/api/timing";
const API_KEY = process.env.API_KEY || "test-timing-key-12345";
const UPDATE_INTERVAL = parseInt(process.env.UPDATE_INTERVAL || "5000");

console.log(`🚀 Starting MQTT server...`);
console.log(`📡 Connecting to MQTT broker at: ${MQTT_BROKER_URL}`);

const client = mqtt.connect(MQTT_BROKER_URL, {
  reconnectPeriod: 1000,
  connectTimeout: 30 * 1000,
});

client.on("connect", () => {
  console.log("✅ Connected to MQTT broker");
  client.subscribe("ondeck", (err: any) => {
    if (!err) {
      console.log("📬 Subscribed to 'ondeck' topic");
      client.publish("ondeck", "GOGO");
    } else {
      console.error("❌ Failed to subscribe to 'ondeck':", err);
    }
  });
  client.subscribe("release", (err: any) => {
    if (!err) {
      console.log("📬 Subscribed to 'release' topic");
    } else {
      console.error("❌ Failed to subscribe to 'release':", err);
    }
  });
});

client.on("error", (err) => {
  console.error("❌ MQTT connection error:", err.message);
});

client.on("reconnect", () => {
  console.log("🔄 Attempting to reconnect to MQTT broker...");
});

client.on("message", (topic, message) => {
  // message is Buffer
  if (topic === "release") {
    const currentTimeMs = Date.now();
    const espTime = Number(message.toString().slice(0, 13));
    const offSet = currentTimeMs - espTime;
    console.log(`⏱️ Release timing offset: ${offSet}ms`);
  }
});

const updateTimers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/status`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const data = (await response.json()) as Race;

  if (!data.current_heat) {
    // Clear the display when there's no current heat
    const clearString = "    ,    ,    ,    ,    ,    "; // Empty spaces for all positions
    console.log(`🧹 Clearing display - no current heat`);
    client.publish("ondeck", clearString);
    return;
  }

  let deckData = {
    leftRacers: [] as string[],
    rightRacers: [] as string[],
  };

  deckData.leftRacers = [
    (
      data.current_heat.racers.find((r) => r.track_number === 1)
        ?.racer_number || "----"
    )
      .toString()
      .padStart(4, " "),
  ];
  deckData.rightRacers = [
    (
      data.current_heat.racers.find((r) => r.track_number === 2)
        ?.racer_number || "----"
    )
      .toString()
      .padStart(4, " "),
  ];

  // Add up to 2 upcoming heats
  const upcomingHeats = data.upcoming_heats.slice(0, 2);
  
  for (const nextRace of upcomingHeats) {
    deckData.leftRacers.push(
      (
        nextRace.racers.find((r) => r.track_number === 1)?.racer_number ||
        "----"
      )
        .toString()
        .padStart(4, " ")
    );
    deckData.rightRacers.push(
      (
        nextRace.racers.find((r) => r.track_number === 2)?.racer_number ||
        "----"
      )
        .toString()
        .padStart(4, " ")
    );
  }
  
  // Pad with empty slots if we have fewer than 3 heats total
  while (deckData.leftRacers.length < 3) {
    deckData.leftRacers.push("    ");  // 4 spaces for empty
    deckData.rightRacers.push("    ");
  }

    const leftString = deckData.leftRacers.join("");
    const rightString = deckData.rightRacers.join("");
    const timingString = [leftString, rightString].join(",");
    
    console.log(`📤 Publishing to 'ondeck': ${timingString}`);
    client.publish("ondeck", timingString);
    
    console.log(`✅ Race data updated successfully`);
  } catch (error) {
    console.error(`❌ Failed to update timers:`, error);
  }
};

// Only start updating if connected to MQTT
let updateInterval: NodeJS.Timeout | null = null;

client.on("connect", () => {
  // Initial update
  updateTimers();
  
  // Clear any existing interval
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  
  // Start periodic updates
  updateInterval = setInterval(() => {
    updateTimers();
  }, UPDATE_INTERVAL);
  
  console.log(`⏰ Updates scheduled every ${UPDATE_INTERVAL}ms`);
});

client.on("close", () => {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
    console.log("⏹️ Stopped periodic updates");
  }
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋 Shutting down gracefully...");
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  client.end();
  process.exit(0);
});