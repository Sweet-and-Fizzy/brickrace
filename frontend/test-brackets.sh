#!/bin/bash

# Bracket System Test Script
# Tests the bracket APIs with mock race times

# Configuration
API_BASE="http://localhost:3000/api"
TIMING_API_KEY="your-timing-api-key"  # Update this with your actual key

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🏁 Bracket System Test Script"
echo "============================"
echo ""

# Function to check current race status
check_status() {
    echo -e "${BLUE}📊 Getting current race status...${NC}"
    
    response=$(curl -s "$API_BASE/races/current")
    
    # Parse response (using grep for simplicity)
    phase=$(echo "$response" | grep -o '"phase":"[^"]*"' | cut -d'"' -f4)
    heat_number=$(echo "$response" | grep -o '"heat_number":[0-9]*' | cut -d':' -f2 | head -1)
    type=$(echo "$response" | grep -o '"type":"[^"]*"' | cut -d'"' -f4 | head -1)
    
    echo "Phase: $phase"
    echo "Current Heat: #$heat_number ($type)"
    echo ""
}

# Function to get timing status
timing_status() {
    echo -e "${BLUE}🔍 Getting timing system status...${NC}"
    
    response=$(curl -s -H "X-API-Key: $TIMING_API_KEY" "$API_BASE/timing/status")
    
    # Parse progress
    total=$(echo "$response" | grep -o '"total_heats":[0-9]*' | cut -d':' -f2)
    completed=$(echo "$response" | grep -o '"completed_heats":[0-9]*' | cut -d':' -f2)
    percent=$(echo "$response" | grep -o '"percent_complete":[0-9]*' | cut -d':' -f2)
    
    echo "Progress: $completed/$total heats ($percent%)"
    echo ""
}

# Function to record times for a heat
record_times() {
    heat_num=$1
    time1=$2
    time2=$3
    
    echo -e "${YELLOW}⏱️  Recording times for heat #$heat_num${NC}"
    echo "  Track 1: ${time1}s"
    echo "  Track 2: ${time2}s"
    
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "X-API-Key: $TIMING_API_KEY" \
        -d "{\"heat_number\":$heat_num,\"track1_time\":$time1,\"track2_time\":$time2,\"auto_advance\":false}" \
        "$API_BASE/timing/record-times")
    
    success=$(echo "$response" | grep -o '"success":true')
    
    if [ ! -z "$success" ]; then
        echo -e "${GREEN}✓ Times recorded successfully${NC}"
        
        # Determine winner
        if (( $(echo "$time1 < $time2" | bc -l) )); then
            echo -e "  🏆 Winner: Track 1 (${time1}s)"
        else
            echo -e "  🏆 Winner: Track 2 (${time2}s)"
        fi
    else
        echo -e "${RED}✗ Failed to record times${NC}"
        echo "$response"
    fi
    echo ""
}

# Test 1: Check current status
echo "==================================="
echo "Test 1: Current Race Status"
echo "==================================="
check_status

# Test 2: Timing system status
echo "==================================="
echo "Test 2: Timing System Status"
echo "==================================="
timing_status

# Test 3: Simulate bracket races
echo "==================================="
echo "Test 3: Simulate Bracket Races"
echo "==================================="
echo ""

# Check if we're in brackets phase
response=$(curl -s "$API_BASE/races/current")
phase=$(echo "$response" | grep -o '"phase":"[^"]*"' | cut -d'"' -f4)

if [ "$phase" != "brackets" ]; then
    echo -e "${YELLOW}⚠️  Race is not in brackets phase. Current phase: $phase${NC}"
    echo "Make sure to:"
    echo "1. Have racers checked in"
    echo "2. Complete qualifying (or skip it)"
    echo "3. Generate brackets from the admin interface"
    exit 1
fi

echo -e "${GREEN}✅ Race is in brackets phase!${NC}"
echo ""

# Get current heat number
heat_number=$(echo "$response" | grep -o '"heat_number":[0-9]*' | cut -d':' -f2 | head -1)

if [ -z "$heat_number" ]; then
    echo -e "${YELLOW}No current heat found. All brackets might be complete.${NC}"
    exit 0
fi

# Simulate 5 bracket races with random times
echo "Simulating bracket races with mock times..."
echo ""

for i in {1..5}; do
    # Get current status
    response=$(curl -s "$API_BASE/races/current")
    heat_number=$(echo "$response" | grep -o '"heat_number":[0-9]*' | cut -d':' -f2 | head -1)
    
    if [ -z "$heat_number" ]; then
        echo -e "${GREEN}All brackets complete!${NC}"
        break
    fi
    
    # Generate random times between 2.000 and 4.000
    time1=$(echo "scale=3; 2 + $RANDOM / 32768 * 2" | bc)
    time2=$(echo "scale=3; 2 + $RANDOM / 32768 * 2" | bc)
    
    echo "Race $i - Heat #$heat_number"
    record_times $heat_number $time1 $time2
    
    # Small delay between races
    sleep 1
done

# Final status
echo "==================================="
echo "Final Status"
echo "==================================="
timing_status

echo -e "${GREEN}✅ Test complete!${NC}"