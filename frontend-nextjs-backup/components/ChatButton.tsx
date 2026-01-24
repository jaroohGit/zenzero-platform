'use client';

import { useEffect, useState } from 'react';

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function ChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      text: 'สวัสดีครับ! ผม Zenzy ผมสามารถช่วยตอบคำถามเกี่ยวกับระบบ IoT ของเราได้ครับ\n\nลองถามเกี่ยวกับ:\n• ข้อมูลเซ็นเซอร์\n• สถานะระบบ\n• ค่า pH, อุณหภูมิ\n• ระบบบำบัดน้ำเสีย',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('th-TH', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      text: input.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const pageContext = extractPageContext();
      const messageLower = input.trim().toLowerCase();
      const suggestedKeys: string[] = [];
      
      pageContext.dataKeys.forEach((key: string) => {
        if (messageLower.includes(key.toLowerCase())) {
          suggestedKeys.push(key);
        }
      });
      
      let enhancedMessage = `USER QUESTION: ${input.trim()}\n\n=== CURRENT PAGE: ${pageContext.page.toUpperCase()} ===\n`;
      
      if (pageContext.dataKeys.length > 0) {
        enhancedMessage += `\n📊 AVAILABLE DATA FIELDS: ${pageContext.dataKeys.join(', ')}\n`;
        if (suggestedKeys.length > 0) {
          enhancedMessage += `💡 RELEVANT FIELDS FOR THIS QUESTION: ${suggestedKeys.join(', ')}\n`;
        }
      }
      
      if (pageContext.data.mqtt && Object.keys(pageContext.data.mqtt).length > 0) {
        enhancedMessage += '\n🔴 REAL-TIME MQTT DATA (Live Sensors):\n';
        Object.entries(pageContext.data.mqtt).forEach(([topic, data]: [string, any]) => {
          enhancedMessage += `${topic}:\n`;
          Object.entries(data).forEach(([key, value]) => {
            if (key !== 'timestamp' && typeof value !== 'object') {
              enhancedMessage += `  - ${key}: ${value}\n`;
            }
          });
        });
      }
      
      if (pageContext.data.sensors && pageContext.data.sensors.length > 0) {
        enhancedMessage += '\n📊 DISPLAYED SENSOR VALUES:\n';
        pageContext.data.sensors.slice(0, 15).forEach((sensor: any) => {
          enhancedMessage += `- ${sensor.name}: ${sensor.value}`;
          if (sensor.unit) enhancedMessage += ` ${sensor.unit}`;
          enhancedMessage += '\n';
        });
      }
      
      if (pageContext.data.stats && pageContext.data.stats.length > 0) {
        enhancedMessage += '\n📈 STATISTICS:\n';
        pageContext.data.stats.slice(0, 10).forEach((stat: any) => {
          enhancedMessage += `- ${stat.label}: ${stat.value}\n`;
        });
      }
      
      if (pageContext.data.charts && pageContext.data.charts.length > 0) {
        enhancedMessage += '\n📉 AVAILABLE CHARTS:\n';
        pageContext.data.charts.forEach((chart: any) => {
          enhancedMessage += `- ${chart.title || chart.id}\n`;
        });
      }
      
      if (pageContext.data.status && pageContext.data.status.length > 0) {
        enhancedMessage += `\n⚡ SYSTEM STATUS: ${pageContext.data.status.join(', ')}\n`;
      }
      
      enhancedMessage += '\n⚠️ CRITICAL: Use the above REAL-TIME data from the current page to answer accurately. This is ACTUAL data from our IoT system, not hypothetical.';
      
      console.log('📊 Page Context:', pageContext);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: enhancedMessage }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();

      const botMessage: Message = {
        text: data.message || 'ขออภัยครับ ไม่สามารถตอบกลับได้ในขณะนี้',
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        text: 'ขออภัยครับ เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const extractPageContext = () => {
    const context: any = {
      page: '',
      data: {},
      dataKeys: [],
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

    // Extract sensor data from sensor cards
    const sensorCards = document.querySelectorAll('.sensor-card, .kpi-card, .card');
    if (sensorCards.length > 0) {
      context.data.sensors = [];
      sensorCards.forEach(card => {
        const label = card.querySelector('.sensor-title, .kpi-label, h3, h4')?.textContent?.trim();
        const value = card.querySelector('.sensor-value, .kpi-value, .kpi-number, strong')?.textContent?.trim();
        const unit = card.querySelector('.sensor-unit, .kpi-unit, small')?.textContent?.trim();
        
        if (label && value && !label.includes('Chart') && !label.includes('Table')) {
          const sensorData: any = {
            name: label,
            value: value
          };
          if (unit) sensorData.unit = unit;
          context.data.sensors.push(sensorData);
          context.dataKeys.push(label);
        }
      });
    }

    // Extract MQTT real-time data if available
    if (typeof (window as any).latestData !== 'undefined' && (window as any).latestData) {
      context.data.mqtt = {};
      Object.keys((window as any).latestData).forEach((topic: string) => {
        if ((window as any).latestData[topic] && Object.keys((window as any).latestData[topic]).length > 0) {
          context.data.mqtt[topic] = (window as any).latestData[topic];
        }
      });
    }

    // Extract table data
    const tables = document.querySelectorAll('table');
    if (tables.length > 0) {
      context.data.tables = [];
      tables.forEach((table: any) => {
        const headers = Array.from(table.querySelectorAll('th')).map((th: any) => th.textContent.trim());
        const rows: any = [];
        
        table.querySelectorAll('tbody tr').forEach((tr: any) => {
          const cells = Array.from(tr.querySelectorAll('td')).map((td: any) => td.textContent.trim());
          if (cells.length > 0 && !cells.every(cell => cell === '')) rows.push(cells);
        });
        
        if (headers.length > 0 && rows.length > 0) {
          context.data.tables.push({ 
            headers, 
            rows: rows.slice(0, 10)
          });
        }
      });
    }

    // Extract chart titles
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
        const text = status.textContent?.trim();
        if (text && text.length < 100 && !text.includes('User')) {
          context.data.status.push(text);
        }
      });
      context.data.status = [...new Set(context.data.status)];
    }

    // Extract headings
    const mainContent = document.querySelector('.main-content, main, #content');
    if (mainContent) {
      const headings = mainContent.querySelectorAll('h1, h2, h3');
      if (headings.length > 0) {
        context.data.headings = Array.from(headings)
          .map((h: any) => h.textContent.trim())
          .filter(text => text.length > 0 && text.length < 100)
          .slice(0, 5);
      }
    }

    return context;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        className={`chat-btn ${isOpen ? 'active' : ''}`}
        onClick={toggleChat}
        aria-label="Open chat"
      >
        <svg className="chat-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <svg className="close-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Chat Window */}
      <div className={`chat-window ${!isOpen ? 'hidden' : ''}`}>
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="chat-avatar">
              <span>Z</span>
            </div>
            <div>
              <h3 className="chat-title">Zenzy Assistant</h3>
              <p className="chat-status">Online - AI Powered</p>
            </div>
          </div>
          <button className="chat-close" onClick={toggleChat}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-message ${msg.isUser ? 'user' : ''}`}>
              <div className="message-avatar">
                {msg.isUser ? 'U' : 'Z'}
              </div>
              <div className="message-content">
                <p className="message-text">{msg.text}</p>
                <div className="message-time">{formatTime(msg.timestamp)}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="chat-input-container">
          <div className="chat-input-wrapper">
            <input
              type="text"
              className="chat-input"
              placeholder="พิมพ์ข้อความ... Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <button
              className={`chat-send ${isLoading ? 'loading' : ''}`}
              onClick={sendMessage}
              disabled={isLoading}
            >
              <svg className="send-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <svg className="loading-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          <p className="chat-footer-text">Powered by Llama AI</p>
        </div>
      </div>
    </>
  );
}
