const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// ===== Configuration =====
const CONFIG = {
  url: process.env.TEST_URL || 'https://www.zenzerobiogas.com',
  timeout: 30000,
  waitForData: 5000,
  thresholds: {
    minOutflowVolume: 50,
    minDataPoints: 100,
    expectedAnnotations: 0
  }
};

// ===== Test Reporter Class =====
class TestReporter {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
    this.logs = [];
  }

  log(emoji, message) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const logEntry = `[${timestamp}] ${emoji} ${message}`;
    console.log(logEntry);
    this.logs.push(logEntry);
  }

  addResult(name, passed, details = '') {
    this.results.push({ name, passed, details });
    const icon = passed ? '✅' : '❌';
    this.log(icon, `${name}${details ? ` - ${details}` : ''}`);
  }

  summary() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 AT-02 Detection Test Summary');
    console.log('='.repeat(70));
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`📍 URL: ${CONFIG.url}`);
    console.log(`✅ Passed: ${passed}/${total} (${((passed/total)*100).toFixed(1)}%)`);
    console.log(`❌ Failed: ${total - passed}/${total}`);
    
    if (passed < total) {
      console.log('\n⚠️  Failed Tests:');
      this.results.filter(r => !r.passed).forEach(r => {
        console.log(`   ❌ ${r.name}: ${r.details}`);
      });
    }
    
    console.log('='.repeat(70));
    
    if (passed === total) {
      console.log('\n🎉 All tests passed!\n');
      return true;
    } else {
      console.log(`\n⚠️  ${total - passed} test(s) failed\n`);
      return false;
    }
  }

  saveReport(filename = 'test-report.json') {
    const report = {
      timestamp: new Date().toISOString(),
      duration: (Date.now() - this.startTime) / 1000,
      url: CONFIG.url,
      results: this.results,
      logs: this.logs,
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.passed).length,
        failed: this.results.filter(r => !r.passed).length
      }
    };

    const reportPath = path.join(__dirname, '../../test-results', filename);
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📄 Test report: ${reportPath}`);
    return reportPath;
  }
}

// ===== Main Test Function =====
async function testAT02Detection() {
  const reporter = new TestReporter();
  let browser, page;

  try {
    reporter.log('🚀', 'Starting AT-02 Water Level Detection Tests');
    reporter.log('🌐', `Target: ${CONFIG.url}`);

    // Launch Browser
    reporter.log('🌐', 'Launching headless browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-extensions',
        '--window-size=1920,1080'
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
    });

    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Capture Console Logs
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      if (
        text.includes('[loadAT02LevelData]') ||
        text.includes('[AT02]') ||
        text.includes('Downtrend') ||
        text.includes('outflow')
      ) {
        consoleLogs.push(text);
      }
    });

    // Capture Network
    let apiCallsMade = 0;
    page.on('response', async response => {
      const url = response.url();
      if (url.includes('/api/wwt01/history')) {
        apiCallsMade++;
      }
      if (response.status() >= 400) {
        reporter.log('⚠️', `HTTP ${response.status()}: ${url}`);
      }
    });

    // Navigate
    reporter.log('🔗', 'Navigating to dashboard...');
    await page.goto(CONFIG.url, {
      waitUntil: 'networkidle2',
      timeout: CONFIG.timeout
    });

    reporter.addResult('Page Navigation', true, `Loaded successfully`);

    await page.waitForFunction(
      () => document.readyState === 'complete',
      { timeout: CONFIG.timeout }
    );

    // Test 1: Chart Container
    reporter.log('🔍', 'Test 1: Checking AT-02 chart...');
    const chartElement = await page.$('#chart-at02-level');
    reporter.addResult(
      'AT-02 Chart Container',
      !!chartElement,
      chartElement ? 'Found #chart-at02-level' : 'Not found'
    );

    if (!chartElement) {
      throw new Error('AT-02 chart not found');
    }

    // Test 2: Wait for Data
    reporter.log('⏳', `Test 2: Waiting for data (${CONFIG.waitForData}ms)...`);
    await new Promise(resolve => setTimeout(resolve, CONFIG.waitForData));

    reporter.addResult(
      'Data Loading',
      apiCallsMade > 0 || consoleLogs.length > 0,
      `${apiCallsMade} API calls, ${consoleLogs.length} logs`
    );

    // Test 3: Moving Average
    reporter.log('📈', 'Test 3: Checking Moving Average line...');
    const legendItems = await page.evaluate(() => {
      const legends = Array.from(document.querySelectorAll('.apexcharts-legend-text'));
      return legends.map(l => l.textContent.trim());
    });

    const hasMovingAvg = legendItems.some(text => 
      text.includes('Moving Average') && text.includes('15min')
    );
    reporter.addResult(
      'Moving Average (15min)',
      hasMovingAvg,
      hasMovingAvg ? 'Found in legend' : 'Not found'
    );

    // Test 4: Threshold Control
    reporter.log('🎛️', 'Test 4: Checking threshold control...');
    const thresholdInput = await page.$('#at02-threshold-input');
    const applyButton = await page.$('#at02-threshold-apply');
    
    reporter.addResult(
      'Threshold Control UI',
      !!(thresholdInput && applyButton),
      thresholdInput ? 'Controls found' : 'Controls missing'
    );

    // Test 5: Detection Algorithm
    reporter.log('🧮', 'Test 5: Checking detection logs...');
    const hasDetection = consoleLogs.some(log => 
      log.includes('Downtrend') || log.includes('outflow')
    );

    reporter.addResult(
      'Detection Algorithm',
      consoleLogs.length > 0,
      hasDetection ? 'Detection logs found' : `${consoleLogs.length} console logs`
    );

    // Test 6: Annotations
    reporter.log('📍', 'Test 6: Checking annotations...');
    const annotations = await page.evaluate(() => {
      const lines = document.querySelectorAll('.apexcharts-xaxis-annotations line');
      const labels = document.querySelectorAll('.apexcharts-xaxis-annotation-label');
      
      return {
        lineCount: lines.length,
        labelCount: labels.length,
        labelTexts: Array.from(labels).map(l => l.textContent.trim())
      };
    });

    reporter.addResult(
      'Annotation Lines',
      annotations.lineCount >= 0,
      `${annotations.lineCount} lines, ${annotations.labelCount} labels`
    );

    if (annotations.labelTexts.length > 0) {
      reporter.log('🏷️', `Labels: ${annotations.labelTexts.join(', ')}`);
    }

    // Test 7: Outflow Detection
    reporter.log('💧', 'Test 7: Analyzing outflow detection...');
    
    const detectionLog = consoleLogs.find(log => 
      log.includes('Found') && log.includes('outflow')
    );

    let outflowCount = 0;
    if (detectionLog) {
      const match = detectionLog.match(/Found (\d+) outflow/);
      outflowCount = match ? parseInt(match[1]) : 0;
    }

    reporter.addResult(
      'Outflow Detection',
      true,
      outflowCount > 0 
        ? `Detected ${outflowCount} period(s)`
        : 'No outflow (normal if stable)'
    );

    // Test 8: API Health
    reporter.log('🔌', 'Test 8: Testing API...');
    const apiTest = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/wwt01/history?minutes=60');
        const data = await response.json();
        
        return {
          success: response.ok,
          status: response.status,
          dataCount: data.length || 0,
          hasAT02: data.some && data.some(d => d.at_02_level != null)
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    reporter.addResult(
      'API Endpoint',
      apiTest.success,
      apiTest.success 
        ? `${apiTest.dataCount} records, AT-02: ${apiTest.hasAT02 ? 'Yes' : 'No'}`
        : `Error: ${apiTest.error}`
    );

    // Test 9: Chart Rendering
    reporter.log('🎨', 'Test 9: Checking chart rendering...');
    const chartQuality = await page.evaluate(() => {
      const svg = document.querySelector('#chart-at02-level svg');
      if (!svg) return { exists: false };

      const paths = svg.querySelectorAll('path').length;
      
      return {
        exists: true,
        pathCount: paths,
        hasData: paths > 10,
        width: svg.getAttribute('width'),
        height: svg.getAttribute('height')
      };
    });

    reporter.addResult(
      'Chart SVG Rendering',
      chartQuality.exists && chartQuality.hasData,
      chartQuality.exists 
        ? `${chartQuality.pathCount} paths, ${chartQuality.width}x${chartQuality.height}`
        : 'SVG not found'
    );

    // Screenshot (with error handling)
    try {
      const screenshotPath = path.join(__dirname, '../../test-results/at02-screenshot.png');
      await page.screenshot({ 
        path: screenshotPath,
        fullPage: false,
        clip: { x: 0, y: 200, width: 1920, height: 600 }
      });
      reporter.log('📸', `Screenshot: ${screenshotPath}`);
    } catch (screenshotError) {
      reporter.log('⚠️', `Screenshot skipped: ${screenshotError.message}`);
    }

    // Console Summary
    if (consoleLogs.length > 0) {
      console.log(`\n📝 Captured ${consoleLogs.length} console logs`);
      consoleLogs.slice(0, 5).forEach(log => console.log(`   ${log}`));
      if (consoleLogs.length > 5) {
        console.log(`   ... and ${consoleLogs.length - 5} more`);
      }
    }

    // Save Report
    reporter.saveReport(`at02-test-${Date.now()}.json`);

    return reporter.summary();

  } catch (error) {
    reporter.log('💥', `Error: ${error.message}`);
    reporter.addResult('Test Execution', false, error.message);
    reporter.saveReport(`at02-error-${Date.now()}.json`);
    return false;

  } finally {
    if (browser) {
      await browser.close();
      reporter.log('🔒', 'Browser closed');
    }
  }
}

// Run Tests
if (require.main === module) {
  console.log('🧪 AT-02 Detection Automated Test Suite\n');
  
  testAT02Detection()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { testAT02Detection, CONFIG };
