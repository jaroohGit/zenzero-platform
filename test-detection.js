#!/usr/bin/env node

/**
 * AT-02 Detection Algorithm Tester
 * ทดสอบ algorithm ก่อน deploy จริง
 * 
 * Usage:
 *   node test-detection.js [minutes] [threshold]
 * 
 * Examples:
 *   node test-detection.js              # ทดสอบข้อมูล 24 ชั่วโมง, threshold -0.005
 *   node test-detection.js 60           # ทดสอบข้อมูล 1 ชั่วโมง
 *   node test-detection.js 1440 -0.01   # ทดสอบ 24 ชม, threshold -0.01
 */

const https = require('https');

// ===== Configuration =====
const CONFIG = {
  apiUrl: 'https://www.zenzerobiogas.com/api/wwt01/history',
  minutes: parseInt(process.argv[2]) || 1440,  // default 24 hours
  threshold: parseFloat(process.argv[3]) || -0.005,
  // Detection parameters - ปรับให้ดูความชันแบบมีนัยสำคัญ
  slopeWindowSize: 10,          // คำนวณ slope จากการเปลี่ยนแปลง 10 จุด (~5 นาที)
  minConsecutivePoints: 6,      // ต้องลดต่อเนื่อง 6 จุด (~30 นาที)
  minVolumeChange: 100,         // m³
  recoveryThreshold: 0.0008,    // slope >= นี้ถึงจะถือว่าหยุดลด
  volumeConversionFactor: 3500,
  // Moving average
  windowSize: 120,  // ~60 minutes
  // Outlier detection
  outlierThreshold: 0.15  // meters
};

// ===== Fetch Data =====
function fetchData() {
  return new Promise((resolve, reject) => {
    const url = `${CONFIG.apiUrl}?minutes=${CONFIG.minutes}&limit=10000`;
    
    console.log(`🔍 Fetching data from API...`);
    console.log(`   URL: ${url}\n`);
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// ===== Remove Outliers =====
function removeOutliers(levelData) {
  const cleanedData = [];
  let outlierCount = 0;
  
  for (let i = 0; i < levelData.length; i++) {
    if (i === 0 || i === levelData.length - 1) {
      cleanedData.push(levelData[i]);
    } else {
      const prev = levelData[i - 1].y;
      const current = levelData[i].y;
      const next = levelData[i + 1].y;
      
      const diffPrev = Math.abs(current - prev);
      const diffNext = Math.abs(current - next);
      
      if (diffPrev > CONFIG.outlierThreshold && diffNext > CONFIG.outlierThreshold) {
        cleanedData.push({
          x: levelData[i].x,
          y: (prev + next) / 2
        });
        outlierCount++;
      } else {
        cleanedData.push(levelData[i]);
      }
    }
  }
  
  console.log(`🧹 Outlier Removal: ${outlierCount} outliers removed\n`);
  return cleanedData;
}

// ===== Calculate Moving Average =====
function calculateMovingAverage(cleanedData) {
  const trendData = [];
  
  for (let i = 0; i < cleanedData.length; i++) {
    const start = Math.max(0, i - Math.floor(CONFIG.windowSize / 2));
    const end = Math.min(cleanedData.length, i + Math.ceil(CONFIG.windowSize / 2));
    const windowPoints = cleanedData.slice(start, end);
    
    if (windowPoints.length > 0) {
      const avgLevel = windowPoints.reduce((sum, p) => sum + p.y, 0) / windowPoints.length;
      trendData.push({
        x: cleanedData[i].x,
        y: avgLevel
      });
    }
  }
  
  console.log(`📈 Moving Average calculated (${CONFIG.windowSize} point window)\n`);
  return trendData;
}

// ===== Detect Downtrends =====
function detectDowntrends(trendData) {
  const detections = [];
  let consecutiveDownPoints = 0;
  let downtrendStart = null;
  let downtrendPeak = null;
  
  // Debug: Sample slope values
  console.log(`\n📉 Sample Slope Values (first 20 & last 20 windows):`);
  for (let i = CONFIG.slopeWindowSize; i < trendData.length; i++) {
    const windowStart = i - CONFIG.slopeWindowSize;
    const levelChange = trendData[i].y - trendData[windowStart].y;
    const avgSlopePerPoint = levelChange / CONFIG.slopeWindowSize;
    
    if (i < CONFIG.slopeWindowSize + 20 || i > trendData.length - 20) {
      const time = new Date(trendData[i].x).toLocaleString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit'
      });
      const marker = avgSlopePerPoint < CONFIG.threshold ? '✓ DOWN' : '     ';
      console.log(`  [${time}] ${avgSlopePerPoint.toFixed(7)} ${marker}`);
    }
  }
  console.log(``);
  
  for (let i = CONFIG.slopeWindowSize; i < trendData.length; i++) {
    // คำนวณความชันจากการเปลี่ยนแปลงในช่วง slopeWindowSize จุด
    // เพื่อดูแนวโน้มที่ชัดเจนขึ้น ไม่ใช่แค่จุดติดกัน
    const windowStart = i - CONFIG.slopeWindowSize;
    const levelChange = trendData[i].y - trendData[windowStart].y;
    const timeChange = (trendData[i].x - trendData[windowStart].x) / (1000 * 60); // minutes
    const slope = levelChange / (timeChange / 60); // m/hour
    
    // ความชันเฉลี่ยต่อจุด (เพื่อเทียบกับ threshold)
    const avgSlopePerPoint = levelChange / CONFIG.slopeWindowSize;
    
    if (avgSlopePerPoint < CONFIG.threshold) {
      consecutiveDownPoints++;
      
      if (consecutiveDownPoints === CONFIG.minConsecutivePoints && !downtrendStart) {
        // Record the point where downtrend was first confirmed (after minConsecutivePoints)
        downtrendStart = {
          index: i - consecutiveDownPoints,
          time: trendData[i - consecutiveDownPoints].x,
          level: trendData[i - consecutiveDownPoints].y
        };
      }
    } else if (avgSlopePerPoint >= CONFIG.recoveryThreshold) {
      if (downtrendStart && consecutiveDownPoints >= CONFIG.minConsecutivePoints) {
        const endIndex = i - 1; // Last point before recovery
        const currentLevel = trendData[endIndex].y;
        const levelDrop = downtrendStart.level - currentLevel;
        const volumeChange = levelDrop * CONFIG.volumeConversionFactor;
        const durationMinutes = (trendData[endIndex].x - downtrendStart.time) / (1000 * 60);
        
        if (volumeChange >= CONFIG.minVolumeChange) {
          detections.push({
            startTime: downtrendStart.time,
            endTime: trendData[endIndex].x,
            startLevel: downtrendStart.level,
            endLevel: currentLevel,
            levelDrop: levelDrop,
            volume: volumeChange,
            duration: durationMinutes
          });
        }
      }
      
      consecutiveDownPoints = 0;
      downtrendStart = null;
      downtrendPeak = null;
    }
  }
  
  return detections;
}

// ===== Display Results =====
function displayResults(detections) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📊 DETECTION RESULTS`);
  console.log(`${'='.repeat(80)}`);
  console.log(`Total Detections: ${detections.length}\n`);
  
  if (detections.length === 0) {
    console.log(`❌ No downtrend periods detected with current parameters.\n`);
    console.log(`Try adjusting parameters:`);
    console.log(`  - Lower minConsecutivePoints (current: ${CONFIG.minConsecutivePoints})`);
    console.log(`  - Lower minVolumeChange (current: ${CONFIG.minVolumeChange} m³)`);
    console.log(`  - Lower recoveryThreshold (current: ${CONFIG.recoveryThreshold})`);
    console.log(`  - Higher threshold (less negative, current: ${CONFIG.threshold})\n`);
  } else {
    detections.forEach((d, idx) => {
      // Data is sorted newest first, so start/end times are reversed
      const actualStart = d.endTime < d.startTime ? d.endTime : d.startTime;
      const actualEnd = d.endTime > d.startTime ? d.endTime : d.startTime;
      const actualDuration = Math.abs(d.duration);
      
      console.log(`📍 Detection #${idx + 1}:`);
      console.log(`   Start:    ${new Date(actualStart).toLocaleString()}`);
      console.log(`   End:      ${new Date(actualEnd).toLocaleString()}`);
      console.log(`   Duration: ${actualDuration.toFixed(1)} minutes (${(actualDuration/60).toFixed(1)} hours)`);
      console.log(`   Level:    ${d.startLevel.toFixed(3)} m → ${d.endLevel.toFixed(3)} m`);
      console.log(`   Drop:     ${Math.abs(d.levelDrop).toFixed(3)} m`);
      console.log(`   Volume:   ${Math.abs(d.volume).toFixed(0)} m³`);
      console.log(``);
    });
  }
  
  console.log(`${'='.repeat(80)}\n`);
}

// ===== Main =====
async function main() {
  console.log(`\n🧪 AT-02 Detection Algorithm Tester\n`);
  console.log(`Parameters:`);
  console.log(`  Time Range:           ${CONFIG.minutes} minutes`);
  console.log(`  Slope Threshold:      ${CONFIG.threshold}`);
  console.log(`  Slope Window Size:    ${CONFIG.slopeWindowSize} points (~${CONFIG.slopeWindowSize/2} min)`);
  console.log(`  Min Consecutive:      ${CONFIG.minConsecutivePoints} points`);
  console.log(`  Min Volume:           ${CONFIG.minVolumeChange} m³`);
  console.log(`  Recovery Threshold:   ${CONFIG.recoveryThreshold}`);
  console.log(`  Moving Avg Window:    ${CONFIG.windowSize} points (~${CONFIG.windowSize/2} min)`);
  console.log(`  Outlier Threshold:    ${CONFIG.outlierThreshold} m\n`);
  
  try {
    // 1. Fetch data
    const rows = await fetchData();
    console.log(`✅ Fetched ${rows.length} records\n`);
    
    if (rows.length === 0) {
      console.log(`❌ No data received. Check API connection.\n`);
      process.exit(1);
    }
    
    // 2. Prepare level data
    const levelData = rows
      .filter(row => row.at_02_level !== null && row.at_02_level !== undefined)
      .map(row => ({
        x: new Date(row.time).getTime(),
        y: parseFloat(row.at_02_level)
      }));
    
    console.log(`📊 Prepared ${levelData.length} data points\n`);
    
    // 3. Remove outliers
    const cleanedData = removeOutliers(levelData);
    
    // 4. Calculate moving average
    const trendData = calculateMovingAverage(cleanedData);
    
    // 5. Detect downtrends
    console.log(`🔍 Running detection algorithm...\n`);
    const detections = detectDowntrends(trendData);
    
    // 6. Display results
    displayResults(detections);
    
    // Summary
    console.log(`Summary:`);
    console.log(`  - If you see detections above, annotations will appear on the chart`);
    console.log(`  - If no detections, adjust parameters and test again`);
    console.log(`  - Once satisfied, deploy with: cd /home/teddy/deploy && ./docker-manage.sh restart frontend\n`);
    
  } catch (error) {
    console.error(`\n❌ Error:`, error.message);
    process.exit(1);
  }
}

main();
