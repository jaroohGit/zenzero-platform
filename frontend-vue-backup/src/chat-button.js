// Chat Button Component for zenzero IoT Platform
// Using same API as CSK Innovate but with Zenzy as assistant

export function createChatButton() {
  const messages = [
    {
      text: 'สวัสดีครับ! ผม Zenzy ผมสามารถช่วยตอบคำถามเกี่ยวกับระบบ IoT ของเราได้ครับ\n\nลองถามเกี่ยวกับ:\n• ข้อมูลเซ็นเซอร์\n• สถานะระบบ\n• ค่า pH, อุณหภูมิ\n• ระบบบำบัดน้ำเสีย',
      isUser: false,
      timestamp: new Date(),
    },
  ];

  let isOpen = false;
  let isLoading = false;

  // Create chat button
  const chatButton = document.createElement('button');
  chatButton.id = 'chatButton';
  chatButton.className = 'chat-btn';
  chatButton.setAttribute('aria-label', 'Open chat');
  chatButton.innerHTML = `
    <svg class="chat-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
    <svg class="close-icon hidden" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  `;

  // Create chat window
  const chatWindow = document.createElement('div');
  chatWindow.id = 'chatWindow';
  chatWindow.className = 'chat-window hidden';
  chatWindow.innerHTML = `
    <div class="chat-header">
      <div class="chat-header-info">
        <div class="chat-avatar">
          <span>Z</span>
        </div>
        <div>
          <h3 class="chat-title">Zenzy Assistant</h3>
          <p class="chat-status" id="chatStatus">Online - AI Powered</p>
        </div>
      </div>
      <button class="chat-close" id="chatClose">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    
    <div class="chat-messages" id="chatMessages">
      ${renderMessages(messages)}
    </div>
    
    <div class="chat-input-container">
      <div class="chat-input-wrapper">
        <input 
          type="text" 
          id="chatInput" 
          class="chat-input" 
          placeholder="พิมพ์ข้อความ... Type a message..."
          autocomplete="off"
        />
        <button class="chat-send" id="chatSend">
          <svg class="send-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          <svg class="loading-icon hidden" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
      <p class="chat-footer-text">Powered by Llama AI</p>
    </div>
  `;

  // Add to DOM
  document.body.appendChild(chatButton);
  document.body.appendChild(chatWindow);

  // Event listeners
  chatButton.addEventListener('click', toggleChat);
  document.getElementById('chatClose').addEventListener('click', toggleChat);
  document.getElementById('chatSend').addEventListener('click', sendMessage);
  document.getElementById('chatInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !isLoading) {
      sendMessage();
    }
  });

  function toggleChat() {
    isOpen = !isOpen;
    chatWindow.classList.toggle('hidden');
    
    const chatIcon = chatButton.querySelector('.chat-icon');
    const closeIcon = chatButton.querySelector('.close-icon');
    
    if (isOpen) {
      chatIcon.classList.add('hidden');
      closeIcon.classList.remove('hidden');
      document.getElementById('chatInput').focus();
    } else {
      chatIcon.classList.remove('hidden');
      closeIcon.classList.add('hidden');
    }
  }

  // Keyword mapping for fuzzy matching
  const keywordMap = {
    'ph': ['ph', 'pH', 'ph value', 'ค่า ph', 'ค่าph'],
    'temperature': ['temperature', 'temp', 'อุณหภูมิ', 'degrees', '°c'],
    'orp': ['orp', 'o.r.p', 'oxidation reduction potential'],
    'flow': ['flow', 'flow rate', 'อัตราการไหล', 'ฟลว์'],
    'bod': ['bod', 'b.o.d', 'biochemical oxygen demand', 'บีโอดี'],
    'cod': ['cod', 'c.o.d', 'chemical oxygen demand', 'ซีโอดี'],
    'tss': ['tss', 't.s.s', 'total suspended solids', 'ของแข็งแขวนลอย'],
    'do': ['do', 'd.o', 'dissolved oxygen', 'ออกซิเจนละลาย'],
    'turbidity': ['turbidity', 'ความขุ่น', 'ntu'],
    'pressure': ['pressure', 'แรงดัน', 'bar', 'psi'],
    'level': ['level', 'ระดับ', 'water level']
  };

  // Function to find similar keys in data
  function findSimilarKey(searchTerm, dataKeys) {
    const lowerSearch = searchTerm.toLowerCase();
    
    // Check keyword mapping first
    for (const [key, keywords] of Object.entries(keywordMap)) {
      for (const keyword of keywords) {
        if (lowerSearch.includes(keyword.toLowerCase())) {
          // Find matching data key
          const match = dataKeys.find(dk => 
            dk.toLowerCase().includes(key) || 
            keywords.some(kw => dk.toLowerCase().includes(kw.toLowerCase()))
          );
          if (match) return match;
        }
      }
    }
    
    // Fuzzy match with data keys
    return dataKeys.find(key => {
      const lowerKey = key.toLowerCase();
      return lowerKey.includes(lowerSearch) || lowerSearch.includes(lowerKey);
    });
  }

  // Function to extract page context
  function extractPageContext() {
    const context = {
      page: '',
      data: {},
      dataKeys: [], // Store all available keys
      timestamp: new Date().toISOString()
    };

    // Get current page name
    const activePage = document.querySelector('.nav-item.active');
    context.page = activePage ? activePage.getAttribute('data-page') : 'unknown';

    // Extract all stat/metric values
    const statValues = document.querySelectorAll('.stat-value, .metric-value, .kpi-number, .value');
    if (statValues.length > 0) {
      context.data.stats = [];
      statValues.forEach(stat => {
        const label = stat.closest('.stat, .metric, .kpi-card')?.querySelector('.stat-label, .metric-label, .kpi-label, label')?.textContent?.trim();
        const value = stat.textContent?.trim();
        
        if (value && value !== '-' && value !== '0') {
          context.data.stats.push({
            label: label || 'Unknown',
            value: value
          });
          if (label) context.dataKeys.push(label);
        }
      });
    }

    // Extract sensor data from KPI cards
    const sensorCards = document.querySelectorAll('.kpi-card, .sensor-card, .card');
    if (sensorCards.length > 0) {
      context.data.sensors = [];
      sensorCards.forEach(card => {
        const label = card.querySelector('.kpi-label, .sensor-label, h3, h4')?.textContent?.trim();
        const value = card.querySelector('.kpi-value, .sensor-value, .kpi-number, strong')?.textContent?.trim();
        const unit = card.querySelector('.kpi-unit, .sensor-unit, small')?.textContent?.trim();
        
        if (label && value && !label.includes('Chart') && !label.includes('Table')) {
          const sensorData = {
            name: label,
            value: value
          };
          if (unit) sensorData.unit = unit;
          context.data.sensors.push(sensorData);
          context.dataKeys.push(label);
        }
      });
      // Remove duplicates
      context.data.sensors = context.data.sensors.filter((sensor, index, self) =>
        index === self.findIndex((s) => s.name === sensor.name && s.value === sensor.value)
      );
    }

    // Extract MQTT real-time data if available (from global latestData)
    if (typeof window.latestData !== 'undefined' && window.latestData) {
      context.data.mqtt = {};
      Object.keys(window.latestData).forEach(topic => {
        if (window.latestData[topic] && Object.keys(window.latestData[topic]).length > 0) {
          context.data.mqtt[topic] = window.latestData[topic];
        }
      });
    }

    // Extract table data
    const tables = document.querySelectorAll('table');
    if (tables.length > 0) {
      context.data.tables = [];
      tables.forEach((table, idx) => {
        const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim());
        const rows = [];
        
        table.querySelectorAll('tbody tr').forEach(tr => {
          const cells = Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim());
          if (cells.length > 0 && !cells.every(cell => cell === '')) rows.push(cells);
        });
        
        if (headers.length > 0 && rows.length > 0) {
          context.data.tables.push({ 
            headers, 
            rows: rows.slice(0, 10) // Limit to 10 rows for context
          });
        }
      });
    }

    // Extract chart titles and visible data
    const chartContainers = document.querySelectorAll('[id*="chart"], .chart-container');
    if (chartContainers.length > 0) {
      context.data.charts = [];
      chartContainers.forEach(chart => {
        const chartId = chart.id;
        const chartTitle = chart.closest('.card')?.querySelector('.card-title, h3, h2, h4')?.textContent?.trim();
        
        if (chartTitle || chartId) {
          context.data.charts.push({
            id: chartId,
            title: chartTitle || chartId
          });
        }
      });
    }

    // Extract status indicators
    const statusElements = document.querySelectorAll('.status-text, .connection-status, .status');
    if (statusElements.length > 0) {
      context.data.status = [];
      statusElements.forEach(status => {
        const text = status.textContent.trim();
        if (text && text.length < 100 && !text.includes('User')) {
          context.data.status.push(text);
        }
      });
      // Remove duplicates
      context.data.status = [...new Set(context.data.status)];
    }

    // Extract visible text content from main area
    const mainContent = document.querySelector('.main-content, main, #content');
    if (mainContent) {
      const headings = mainContent.querySelectorAll('h1, h2, h3');
      if (headings.length > 0) {
        context.data.headings = Array.from(headings)
          .map(h => h.textContent.trim())
          .filter(text => text.length > 0 && text.length < 100)
          .slice(0, 5);
      }
    }

    return context;
  }

  async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message || isLoading) return;

    // Add user message
    messages.push({
      text: message,
      isUser: true,
      timestamp: new Date(),
    });
    
    input.value = '';
    updateMessages();
    setLoading(true);

    try {
      // Extract page context
      const pageContext = extractPageContext();
      
      // Find similar keys if exact match not found
      const messageLower = message.toLowerCase();
      const suggestedKeys = [];
      pageContext.dataKeys.forEach(key => {
        if (messageLower.includes(key.toLowerCase()) || 
            findSimilarKey(messageLower, [key])) {
          suggestedKeys.push(key);
        }
      });
      
      // Build enhanced message with context
      let enhancedMessage = `USER QUESTION: ${message}\n\n=== CURRENT PAGE: ${pageContext.page.toUpperCase()} ===\n`;
      
      // Add available data fields hint
      if (pageContext.dataKeys.length > 0) {
        enhancedMessage += `\n📊 AVAILABLE DATA FIELDS: ${pageContext.dataKeys.join(', ')}\n`;
        if (suggestedKeys.length > 0) {
          enhancedMessage += `💡 RELEVANT FIELDS FOR THIS QUESTION: ${suggestedKeys.join(', ')}\n`;
        }
      }
      
      // Add MQTT real-time data (highest priority)
      if (pageContext.data.mqtt && Object.keys(pageContext.data.mqtt).length > 0) {
        enhancedMessage += '\n🔴 REAL-TIME MQTT DATA (Live Sensors):\n';
        Object.entries(pageContext.data.mqtt).forEach(([topic, data]) => {
          enhancedMessage += `${topic}:\n`;
          Object.entries(data).forEach(([key, value]) => {
            if (key !== 'timestamp' && typeof value !== 'object') {
              enhancedMessage += `  - ${key}: ${value}\n`;
              pageContext.dataKeys.push(`${topic}/${key}`);
            }
          });
        });
      }
      
      // Add sensor/stat data from page
      if (pageContext.data.sensors && pageContext.data.sensors.length > 0) {
        enhancedMessage += '\n📊 DISPLAYED SENSOR VALUES:\n';
        pageContext.data.sensors.slice(0, 15).forEach(sensor => {
          enhancedMessage += `- ${sensor.name}: ${sensor.value}`;
          if (sensor.unit) enhancedMessage += ` ${sensor.unit}`;
          enhancedMessage += '\n';
        });
      }
      
      // Add stats if available
      if (pageContext.data.stats && pageContext.data.stats.length > 0) {
        enhancedMessage += '\n📈 STATISTICS:\n';
        pageContext.data.stats.slice(0, 10).forEach(stat => {
          enhancedMessage += `- ${stat.label}: ${stat.value}\n`;
        });
      }
      
      // Add table data (summarized)
      if (pageContext.data.tables && pageContext.data.tables.length > 0) {
        enhancedMessage += '\n📋 TABLE DATA:\n';
        pageContext.data.tables.forEach((table, idx) => {
          if (table.headers.length > 0) {
            enhancedMessage += `Table ${idx + 1}:\n`;
            enhancedMessage += `Headers: ${table.headers.join(' | ')}\n`;
            const rowCount = Math.min(5, table.rows.length);
            for (let i = 0; i < rowCount; i++) {
              enhancedMessage += `Row ${i + 1}: ${table.rows[i].join(' | ')}\n`;
            }
            if (table.rows.length > rowCount) {
              enhancedMessage += `... and ${table.rows.length - rowCount} more rows\n`;
            }
          }
        });
      }
      
      // Add charts info
      if (pageContext.data.charts && pageContext.data.charts.length > 0) {
        enhancedMessage += '\n📉 AVAILABLE CHARTS:\n';
        pageContext.data.charts.forEach(chart => {
          enhancedMessage += `- ${chart.title || chart.id}\n`;
        });
      }
      
      // Add status
      if (pageContext.data.status && pageContext.data.status.length > 0) {
        enhancedMessage += `\n⚡ SYSTEM STATUS: ${pageContext.data.status.join(', ')}\n`;
      }
      
      // Add headings for context
      if (pageContext.data.headings && pageContext.data.headings.length > 0) {
        enhancedMessage += `\n📝 PAGE SECTIONS: ${pageContext.data.headings.join(', ')}\n`;
      }
      
      enhancedMessage += '\n⚠️ CRITICAL: Use the above REAL-TIME data from the current page to answer accurately. This is ACTUAL data from our IoT system, not hypothetical.';
      
      console.log('📊 Page Context:', pageContext);
      console.log('📝 Enhanced Message Preview:', enhancedMessage.substring(0, 500) + '...');

      // Call Zenzy Chat API via Nginx proxy
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: enhancedMessage }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      
      // Add bot response with Zenzi's name
      messages.push({
        text: data.message || 'ขอโทษครับ ไม่สามารถตอบคำถามได้ในขณะนี้',
        isUser: false,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Chat error:', error);
      messages.push({
        text: 'ขอโทษครับ ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง',
        isUser: false,
        timestamp: new Date(),
      });
    } finally {
      setLoading(false);
      updateMessages();
    }
  }

  function setLoading(loading) {
    isLoading = loading;
    const statusElement = document.getElementById('chatStatus');
    const sendIcon = document.querySelector('.send-icon');
    const loadingIcon = document.querySelector('.loading-icon');
    const inputElement = document.getElementById('chatInput');
    
    if (loading) {
      statusElement.textContent = 'Typing...';
      sendIcon.classList.add('hidden');
      loadingIcon.classList.remove('hidden');
      loadingIcon.classList.add('animate-spin');
      inputElement.disabled = true;
    } else {
      statusElement.textContent = 'Online - AI Powered';
      sendIcon.classList.remove('hidden');
      loadingIcon.classList.add('hidden');
      loadingIcon.classList.remove('animate-spin');
      inputElement.disabled = false;
    }
  }

  function updateMessages() {
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.innerHTML = renderMessages(messages);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function renderMessages(msgs) {
    return msgs.map((msg) => `
      <div class="chat-message ${msg.isUser ? 'user' : 'bot'}">
        ${!msg.isUser ? `
          <div class="message-avatar">
            <span>Z</span>
          </div>
        ` : ''}
        <div class="message-content">
          <div class="message-bubble ${msg.isUser ? 'user-bubble' : 'bot-bubble'}">
            <p class="message-text">${escapeHtml(msg.text).replace(/\n/g, '<br>')}</p>
          </div>
          <p class="message-time">
            ${msg.timestamp.toLocaleTimeString('th-TH', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
    `).join('');
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  return {
    open: () => {
      if (!isOpen) toggleChat();
    },
    close: () => {
      if (isOpen) toggleChat();
    },
    isOpen: () => isOpen,
  };
}
