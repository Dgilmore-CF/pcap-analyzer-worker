/**
 * Web UI for WARP Diagnostics Analyzer
 * Embedded HTML interface for browser access
 */

export const UI_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WARP Diagnostics Analyzer</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 0;
            margin: 0;
        }
        
        .header {
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(0, 0, 0, 0.08);
            padding: 20px 0;
            margin-bottom: 0;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            position: sticky;
            top: 0;
            z-index: 100;
        }
        
        .header-content {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 30px;
            display: flex;
            align-items: center;
            gap: 15px;
            justify-content: space-between;
        }
        
        .header-left {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .logo {
            font-size: 36px;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
        }
        
        .header h1 {
            color: #2d3748;
            font-size: 26px;
            font-weight: 700;
            margin: 0;
            letter-spacing: -0.5px;
        }
        
        .header-badge {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .main-wrapper {
            padding: 40px 30px;
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
            padding: 48px;
            width: 100%;
            margin-bottom: 30px;
        }
        
        .tabs {
            display: flex;
            gap: 8px;
            margin-bottom: 32px;
            background: #f7fafc;
            padding: 6px;
            border-radius: 12px;
        }
        
        .tab {
            padding: 12px 28px;
            background: transparent;
            border: none;
            cursor: pointer;
            color: #4a5568;
            font-size: 15px;
            font-weight: 600;
            border-radius: 8px;
            transition: all 0.2s;
            position: relative;
        }
        
        .tab:hover {
            color: #667eea;
            background: white;
        }
        
        .tab.active {
            color: white;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
        }
        
        .upload-area {
            border: 3px dashed #cbd5e0;
            border-radius: 16px;
            padding: 60px 40px;
            text-align: center;
            margin-bottom: 24px;
            cursor: pointer;
            transition: all 0.3s ease;
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            position: relative;
            overflow: hidden;
        }
        
        .upload-area::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.1), transparent);
            transition: left 0.5s;
        }
        
        .upload-area:hover {
            border-color: #667eea;
            background: white;
            box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
            transform: translateY(-2px);
        }
        
        .upload-area:hover::before {
            left: 100%;
        }
        
        .upload-area.dragover {
            border-color: #667eea;
            background: linear-gradient(135deg, #f0f4ff 0%, #e9f0ff 100%);
            border-style: solid;
            box-shadow: 0 12px 32px rgba(102, 126, 234, 0.2);
        }
        
        input[type="file"] {
            display: none;
        }
        
        .upload-icon {
            font-size: 64px;
            margin-bottom: 16px;
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
        }
        
        .upload-text {
            color: #4a5568;
            font-size: 16px;
            font-weight: 500;
            line-height: 1.6;
        }
        
        .upload-text strong {
            color: #2d3748;
            font-weight: 700;
        }
        
        .upload-text small {
            display: block;
            margin-top: 8px;
            color: #718096;
            font-size: 14px;
        }
        
        button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 16px 32px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
            width: 100%;
            box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
            letter-spacing: 0.3px;
        }
        
        button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
        }
        
        button:active:not(:disabled) {
            transform: translateY(0);
        }
        
        button:disabled {
            background: #cbd5e0;
            cursor: not-allowed;
            box-shadow: none;
        }
        
        .selected-files {
            margin: 24px 0;
            padding: 24px;
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            border-radius: 12px;
            border: 2px solid #e2e8f0;
        }
        
        .selected-files strong {
            color: #2d3748;
            font-size: 15px;
            font-weight: 700;
            display: block;
            margin-bottom: 12px;
        }
        
        .file-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            border-bottom: 1px solid #e2e8f0;
            background: white;
            margin-bottom: 8px;
            border-radius: 8px;
            transition: all 0.2s;
        }
        
        .file-item:last-child {
            border-bottom: none;
            margin-bottom: 0;
        }
        
        .file-item:hover {
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            transform: translateX(4px);
        }
        
        .file-name {
            font-size: 14px;
            color: #2d3748;
            font-weight: 600;
        }
        
        .file-size {
            font-size: 13px;
            color: #718096;
            font-weight: 500;
        }
        
        .loading {
            display: none;
            text-align: center;
            padding: 40px;
            color: #4a5568;
        }
        
        .loading.active {
            display: block;
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            border-radius: 16px;
            margin-top: 24px;
        }
        
        .progress-container {
            width: 100%;
            height: 10px;
            background-color: #edf2f7;
            border-radius: 10px;
            margin: 24px 0 12px 0;
            overflow: hidden;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.08);
        }
        
        .progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            border-radius: 10px;
            width: 0;
            transition: width 0.4s ease;
            box-shadow: 0 0 12px rgba(102,126,234,0.5);
        }
        
        .progress-status {
            font-size: 15px;
            color: #4a5568;
            margin-top: 8px;
            min-height: 24px;
            font-weight: 500;
        }
        
        .pcap-options {
            margin: 24px 0;
            padding: 20px;
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            border-radius: 12px;
            border: 2px solid #e2e8f0;
        }
        
        .pcap-options label {
            display: block;
            margin-bottom: 12px;
            color: #2d3748;
            font-weight: 600;
            font-size: 15px;
        }
        
        .packet-count-select {
            width: 100%;
            padding: 12px 16px;
            font-size: 15px;
            border: 2px solid #cbd5e0;
            border-radius: 10px;
            background-color: white;
            cursor: pointer;
            transition: all 0.2s;
            font-weight: 500;
            color: #2d3748;
        }
        
        .packet-count-select:hover {
            border-color: #667eea;
            box-shadow: 0 2px 8px rgba(102,126,234,0.15);
        }
        
        .packet-count-select:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102,126,234,0.2);
        }
        
        .spinner {
            border: 4px solid #edf2f7;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 48px;
            height: 48px;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 16px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .results {
            margin-top: 32px;
            display: none;
        }
        
        .results.active {
            display: block;
        }
        
        .result-header {
            font-size: 28px;
            font-weight: 700;
            color: #2d3748;
            margin-bottom: 20px;
            letter-spacing: -0.5px;
        }
        
        .health-status {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 700;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .health-status.healthy {
            background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
            color: white;
        }
        
        .health-status.degraded {
            background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
            color: white;
        }
        
        .health-status.critical {
            background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
            color: white;
        }
        
        .issue {
            background: white;
            padding: 24px;
            margin-bottom: 20px;
            border-radius: 12px;
            border-left: 5px solid #667eea;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            transition: all 0.3s ease;
        }
        
        .issue:hover {
            box-shadow: 0 8px 24px rgba(0,0,0,0.12);
            transform: translateY(-2px);
        }
        
        .issue.critical {
            border-left-color: #f56565;
            background: linear-gradient(135deg, #fff5f5 0%, #ffffff 100%);
        }
        
        .issue.warning {
            border-left-color: #ed8936;
            background: linear-gradient(135deg, #fffaf0 0%, #ffffff 100%);
        }
        
        .issue-title {
            font-weight: 700;
            margin-bottom: 12px;
            color: #2d3748;
            font-size: 18px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .issue-description {
            font-size: 15px;
            color: #4a5568;
            margin-bottom: 16px;
            line-height: 1.7;
        }
        
        .issue-remediation {
            font-size: 15px;
            color: #2d3748;
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            padding: 16px 20px;
            border-radius: 10px;
            border-left: 4px solid #667eea;
        }
        
        .issue-remediation strong {
            color: #2d3748;
            font-weight: 700;
        }
        
        .issue-remediation ol {
            margin: 8px 0 0 20px;
            padding-left: 10px;
            line-height: 1.8;
        }
        
        .issue-remediation li {
            margin-bottom: 8px;
            padding-left: 5px;
        }
        
        .issue-remediation li:last-child {
            margin-bottom: 0;
        }
        
        pre {
            background: #1f1f1f;
            color: #f8f8f2;
            padding: 16px;
            border-radius: 6px;
            overflow-x: auto;
            font-size: 13px;
            margin-top: 15px;
            max-height: 400px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            line-height: 1.5;
        }
        
        .error {
            background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
            color: #c53030;
            padding: 20px 24px;
            border-radius: 12px;
            margin-top: 20px;
            display: none;
            border-left: 5px solid #f56565;
            box-shadow: 0 4px 12px rgba(245,101,101,0.2);
            font-weight: 600;
        }
        
        .error.active {
            display: block;
            animation: slideIn 0.3s ease;
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .api-info {
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            padding: 28px;
            border-radius: 12px;
            margin-bottom: 24px;
            border: 2px solid #e2e8f0;
        }
        
        .api-info h3 {
            color: #2d3748;
            margin-bottom: 16px;
            font-size: 20px;
            font-weight: 700;
        }
        
        .api-info code {
            background: #1f1f1f;
            color: #f38020;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 13px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }
        
        .api-info pre {
            margin-top: 10px;
        }
        
        .endpoint-badge {
            display: inline-block;
            background: #f38020;
            color: white;
            padding: 6px 14px;
            border-radius: 4px;
            font-size: 13px;
            margin-bottom: 10px;
            font-weight: 500;
        }
        
        .timeline-section {
            margin-top: 32px;
            margin-bottom: 32px;
            background: white;
            padding: 32px;
            border-radius: 16px;
            border: 2px solid #e2e8f0;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        
        .timeline-header {
            font-size: 22px;
            font-weight: 700;
            color: #2d3748;
            margin-bottom: 24px;
            padding-bottom: 12px;
            border-bottom: 3px solid #667eea;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .timeline-container {
            position: relative;
            padding-left: 40px;
        }
        
        .timeline-container::before {
            content: '';
            position: absolute;
            left: 15px;
            top: 0;
            bottom: 0;
            width: 3px;
            background: linear-gradient(to bottom, #667eea, #764ba2);
            border-radius: 3px;
        }
        
        .timeline-event {
            position: relative;
            margin-bottom: 25px;
            padding-left: 15px;
        }
        
        .timeline-event:last-child {
            margin-bottom: 0;
        }
        
        .timeline-marker {
            position: absolute;
            left: -34px;
            top: 0;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: white;
            border: 4px solid #667eea;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 3px 8px rgba(102,126,234,0.3);
        }
        
        .timeline-icon {
            font-size: 16px;
        }
        
        .timeline-event.critical .timeline-marker {
            border-color: #c41e3a;
            background: #ffd4d4;
        }
        
        .timeline-event.warning .timeline-marker {
            border-color: #f39c12;
            background: #fff4e5;
        }
        
        .timeline-event.success .timeline-marker {
            border-color: #27ae60;
            background: #d4f4dd;
        }
        
        .timeline-content {
            background: linear-gradient(135deg, #f7fafc 0%, #ffffff 100%);
            padding: 18px;
            border-radius: 10px;
            border-left: 4px solid #667eea;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
            transition: all 0.2s;
        }
        
        .timeline-content:hover {
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
            transform: translateX(4px);
        }
        
        .timeline-event.critical .timeline-content {
            border-left-color: #f56565;
            background: linear-gradient(135deg, #fff5f5 0%, #ffffff 100%);
        }
        
        .timeline-event.warning .timeline-content {
            border-left-color: #ed8936;
            background: linear-gradient(135deg, #fffaf0 0%, #ffffff 100%);
        }
        
        .timeline-event.success .timeline-content {
            border-left-color: #48bb78;
            background: linear-gradient(135deg, #f0fff4 0%, #ffffff 100%);
        }
        
        .timeline-timestamp {
            font-size: 13px;
            color: #718096;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            margin-bottom: 8px;
            font-weight: 600;
            background: #edf2f7;
            padding: 4px 10px;
            border-radius: 6px;
            display: inline-block;
        }
        
        .timeline-event-title {
            font-size: 16px;
            font-weight: 700;
            color: #2d3748;
            margin-bottom: 10px;
        }
        
        .timeline-details {
            font-size: 15px;
            color: #4a5568;
            margin-bottom: 12px;
            line-height: 1.6;
        }
        
        .timeline-log-ref {
            margin-top: 12px;
        }
        
        .timeline-log-ref details {
            background: #f9f9f9;
            border: 1px solid #e5e5e5;
            border-radius: 4px;
            padding: 8px 12px;
        }
        
        .timeline-log-ref summary {
            cursor: pointer;
            font-size: 13px;
            color: #f38020;
            font-weight: 500;
            user-select: none;
        }
        
        .timeline-log-ref summary:hover {
            color: #d66e1a;
        }
        
        .log-ref-content {
            margin-top: 8px;
            padding: 10px;
            background: #1f1f1f;
            color: #f8f8f2;
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 12px;
            line-height: 1.6;
            overflow-x: auto;
        }
        
        .timeline-source {
            font-size: 12px;
            color: #888;
            margin-top: 8px;
            font-style: italic;
        }
        
        .log-evidence {
            margin-top: 15px;
        }
        
        .log-evidence details {
            background: #f9f9f9;
            border: 1px solid #e5e5e5;
            border-radius: 4px;
            padding: 10px 15px;
            margin-top: 8px;
        }
        
        .log-evidence summary {
            cursor: pointer;
            font-weight: 600;
            color: #1f1f1f;
            padding: 5px 0;
            user-select: none;
        }
        
        .log-evidence summary:hover {
            color: #f38020;
        }
        
        .log-entry {
            background: #1f1f1f;
            color: #f8f8f2;
            padding: 12px;
            margin: 10px 0 5px 0;
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 12px;
            line-height: 1.5;
            overflow-x: auto;
            border-left: 3px solid #f38020;
        }
        
        .log-entry-header {
            color: #f38020;
            font-weight: 600;
            margin-bottom: 6px;
            font-size: 11px;
        }
        
        .log-entry-content {
            white-space: pre-wrap;
            word-break: break-word;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-content">
            <div class="header-left">
                <span class="logo">☁️</span>
                <h1>WARP Diagnostics Analyzer</h1>
            </div>
            <span class="header-badge">AI Powered</span>
        </div>
    </div>
    
    <div class="main-wrapper">
        <div class="container">
        <div class="tabs">
            <button class="tab active" data-tab="upload">Upload & Analyze</button>
            <button class="tab" data-tab="api">API Documentation</button>
        </div>
        
        <div id="upload-tab" class="tab-content active">
            <div class="upload-area" id="uploadArea">
                <div class="upload-icon">📁</div>
                <div class="upload-text">
                    Click or drag files here<br>
                    <small>Supports: .zip (warp-diag), .pcap, .pcapng, .log, .txt, .json</small>
                </div>
                <input type="file" id="fileInput" multiple accept=".zip,.pcap,.pcapng,.log,.txt,.json">
            </div>
            
            <div class="selected-files" id="selectedFiles" style="display: none;">
                <strong>Selected Files:</strong>
                <div id="fileList"></div>
            </div>
            
            <div class="pcap-options" id="pcapOptions" style="display: none;">
                <label for="packetCount">
                    <strong>🔍 PCAP Packet Analysis Depth:</strong>
                </label>
                <select id="packetCount" class="packet-count-select">
                    <option value="25">25 packets (Fast)</option>
                    <option value="50" selected>50 packets (Balanced)</option>
                    <option value="100">100 packets (Detailed)</option>
                    <option value="200">200 packets (Thorough)</option>
                    <option value="0">All packets (Complete - may be slow)</option>
                </select>
                <small style="display: block; margin-top: 5px; color: #666;">
                    More packets = better analysis but slower processing
                </small>
            </div>
            
            <button id="analyzeBtn" disabled>Analyze Files</button>
            
            <div class="loading" id="loading">
                <div class="spinner"></div>
                <p id="loadingMessage">Analyzing with AI... This may take a few seconds</p>
                <div class="progress-container">
                    <div class="progress-bar" id="progressBar"></div>
                </div>
                <p id="progressStatus" class="progress-status"></p>
            </div>
            
            <div class="error" id="error"></div>
            
            <div class="results" id="results"></div>
        </div>
        
        <div id="api-tab" class="tab-content">
            <div class="api-info">
                <h3>📡 API Endpoint</h3>
                <p class="endpoint-badge" id="apiEndpoint">Loading...</p>
                
                <h3 style="margin-top: 20px;">Upload Files</h3>
                <p><strong>POST /</strong></p>
                <p style="margin: 10px 0; color: #666;">Send files using multipart/form-data</p>
                
                <p><strong>Example with cURL:</strong></p>
                <pre id="curlExample">curl -X POST <span id="curlUrl">...</span> \\
  -F "file=@warp-debugging-info.zip"</pre>
                
                <p style="margin-top: 15px;"><strong>Example with JavaScript:</strong></p>
                <pre>const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('<span id="jsUrl">...</span>', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result);</pre>
                
                <h3 style="margin-top: 20px;">Get API Info</h3>
                <p><strong>GET /</strong></p>
                <p style="margin: 10px 0; color: #666;">Returns API information (JSON response)</p>
                <pre id="getExample">curl <span id="getUrl">...</span></pre>
            </div>
        </div>
    </div>

    <script>
        console.log('Script starting...');
        
        try {
            const currentUrl = window.location.origin;
            console.log('Current URL:', currentUrl);
            
            // Update API documentation with current URL
            const apiEndpoint = document.getElementById('apiEndpoint');
            const curlUrl = document.getElementById('curlUrl');
            const jsUrl = document.getElementById('jsUrl');
            const getUrl = document.getElementById('getUrl');
            
            if (apiEndpoint) apiEndpoint.textContent = currentUrl;
            if (curlUrl) curlUrl.textContent = currentUrl;
            if (jsUrl) jsUrl.textContent = currentUrl;
            if (getUrl) getUrl.textContent = currentUrl;
            
            console.log('API docs updated');
            
            // Tab switching
            const tabs = document.querySelectorAll('.tab');
            console.log('Found tabs:', tabs.length);
            
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    console.log('Tab clicked:', tab.dataset.tab);
                    const tabName = tab.dataset.tab;
                    
                    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                    
                    tab.classList.add('active');
                    document.getElementById(tabName + '-tab').classList.add('active');
                });
            });
            
            console.log('Tab listeners attached');
            
            const uploadArea = document.getElementById('uploadArea');
            const fileInput = document.getElementById('fileInput');
            const analyzeBtn = document.getElementById('analyzeBtn');
            const selectedFiles = document.getElementById('selectedFiles');
            const fileList = document.getElementById('fileList');
            const loading = document.getElementById('loading');
            const results = document.getElementById('results');
            const errorDiv = document.getElementById('error');
            
            console.log('Elements found:', {
                uploadArea: !!uploadArea,
                fileInput: !!fileInput,
                analyzeBtn: !!analyzeBtn
            });

            let files = [];

            uploadArea.addEventListener('click', () => {
                console.log('Upload area clicked');
                fileInput.click();
            });

        fileInput.addEventListener('change', (e) => {
            files = Array.from(e.target.files);
            updateFileList();
        });

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            files = Array.from(e.dataTransfer.files);
            updateFileList();
        });

        function updateFileList() {
            if (files.length === 0) {
                selectedFiles.style.display = 'none';
                analyzeBtn.disabled = true;
                document.getElementById('pcapOptions').style.display = 'none';
                return;
            }

            selectedFiles.style.display = 'block';
            analyzeBtn.disabled = false;

            fileList.innerHTML = files.map(file => 
                '<div class="file-item">' +
                    '<span class="file-name">' + file.name + '</span>' +
                    '<span class="file-size">' + formatBytes(file.size) + '</span>' +
                '</div>'
            ).join('');
            
            // Show PCAP options if any PCAP/PCAPNG files are selected
            const hasPcapFiles = files.some(file => {
                const name = file.name.toLowerCase();
                return name.endsWith('.pcap') || name.endsWith('.pcapng');
            });
            
            const pcapOptions = document.getElementById('pcapOptions');
            if (hasPcapFiles) {
                pcapOptions.style.display = 'block';
            } else {
                pcapOptions.style.display = 'none';
            }
        }

        function formatBytes(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
        }

        analyzeBtn.addEventListener('click', async () => {
            if (files.length === 0) return;

            loading.classList.add('active');
            results.classList.remove('active');
            errorDiv.classList.remove('active');
            analyzeBtn.disabled = true;
            
            const progressBar = document.getElementById('progressBar');
            const progressStatus = document.getElementById('progressStatus');
            const loadingMessage = document.getElementById('loadingMessage');
            
            // Reset progress
            progressBar.style.width = '0%';
            progressStatus.textContent = '';

            try {
                // Stage 1: Preparing files
                updateProgress(10, 'Preparing files for upload...');
                
                const formData = new FormData();
                files.forEach((file, index) => {
                    formData.append('file' + index, file);
                });
                
                // Include packet count if PCAP files are present
                const packetCountSelect = document.getElementById('packetCount');
                if (packetCountSelect && packetCountSelect.offsetParent !== null) {
                    formData.append('packetCount', packetCountSelect.value);
                }
                
                // Stage 2: Uploading
                updateProgress(25, 'Uploading files to server...');
                
                const response = await fetch(currentUrl, {
                    method: 'POST',
                    body: formData,
                });
                
                // Stage 3: Processing
                updateProgress(50, 'Processing files and extracting data...');

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Analysis failed');
                }
                
                // Stage 4: AI Analysis
                updateProgress(75, 'Running AI analysis...');
                
                const data = await response.json();
                
                // Stage 5: Complete
                updateProgress(100, 'Analysis complete!');
                
                // Small delay to show 100% before transitioning
                await new Promise(resolve => setTimeout(resolve, 500));
                
                displayResults(data);
            } catch (error) {
                showError(error.message);
            } finally {
                loading.classList.remove('active');
                analyzeBtn.disabled = false;
            }
        });

        function updateProgress(percent, message) {
            const progressBar = document.getElementById('progressBar');
            const progressStatus = document.getElementById('progressStatus');
            
            if (progressBar) {
                progressBar.style.width = percent + '%';
            }
            if (progressStatus && message) {
                progressStatus.textContent = message;
            }
        }

        function showError(message) {
            errorDiv.textContent = '\u274c Error: ' + message;
            errorDiv.classList.add('active');
        }
        
        function escapeHtml(text) {
            if (!text) return '';
            if (typeof text !== 'string') text = String(text);
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function formatRemediation(text) {
            if (!text) return '';
            
            // Ensure text is a string
            if (typeof text !== 'string') {
                text = String(text);
            }
            
            // Check if text contains numbered steps (e.g., "1.", "2.", etc.)
            const numberedPattern = /(\\d+\\.\\s+[^\\d]+?)(?=\\d+\\.\\s+|$)/g;
            const matches = text.match(numberedPattern);
            
            if (matches && matches.length > 1) {
                // Format as ordered list
                const steps = matches.map(step => {
                    // Remove leading number and clean up
                    const cleaned = step.replace(/^\\d+\\.\\s*/, '').trim();
                    return '<li>' + cleaned + '</li>';
                }).join('');
                return '<ol>' + steps + '</ol>';
            }
            
            // Otherwise, just preserve line breaks
            return text.replace(/\\n/g, '<br>');
        }

        function displayResults(data) {
            results.classList.add('active');
            
            const analysis = data.analysis || {};
            const healthStatus = analysis.health_status || 'Unknown';
            const issues = analysis.issues || [];

            let html = '<div class="result-header">Analysis Results</div>' +
                '<div class="health-status ' + String(healthStatus).toLowerCase() + '">' + escapeHtml(healthStatus) + '</div>' +
                '<p><strong>Summary:</strong> ' + escapeHtml(analysis.summary || 'No summary available') + '</p>' +
                '<p style="margin-top: 10px; font-size: 14px; color: #666;">' +
                    'Files Processed: ' + (data.filesProcessed?.total || 0) + ' | ' +
                    'Files Analyzed: ' + (data.filesAnalyzed || 0) + ' | ' +
                    'Model: ' + (data.modelUsed || 'Unknown') +
                '</p>';

            // Display timeline if available
            const timeline = analysis.timeline || [];
            if (timeline.length > 0) {
                html += '<div class="timeline-section">' +
                    '<div class="timeline-header">📅 Event Timeline (' + timeline.length + ' events)</div>' +
                    '<div class="timeline-container">';
                
                timeline.forEach((event, index) => {
                    const severity = event.severity || 'Info';
                    const eventType = event.event_type || 'Info';
                    const timestamp = event.timestamp || 'Unknown time';
                    const eventDesc = event.event || 'Event';
                    const details = event.details || '';
                    const sourceFile = event.source_file || '';
                    const logRef = event.log_reference;
                    
                    // Choose icon based on event type
                    let icon = 'ℹ️';
                    if (eventType === 'Connection') icon = '🔌';
                    else if (eventType === 'Configuration') icon = '⚙️';
                    else if (eventType === 'Error') icon = '❌';
                    else if (eventType === 'State') icon = '🔄';
                    else if (eventType === 'Network') icon = '🌐';
                    
                    // Severity styling
                    let severityClass = severity.toLowerCase();
                    if (severity === 'Success') severityClass = 'success';
                    
                    html += '<div class="timeline-event ' + severityClass + '">' +
                        '<div class="timeline-marker">' +
                            '<span class="timeline-icon">' + icon + '</span>' +
                        '</div>' +
                        '<div class="timeline-content">' +
                            '<div class="timeline-timestamp">' + escapeHtml(timestamp) + '</div>' +
                            '<div class="timeline-event-title">' + escapeHtml(eventDesc) + '</div>';
                    
                    if (details) {
                        html += '<div class="timeline-details">' + escapeHtml(details) + '</div>';
                    }
                    
                    // Show log reference if available
                    if (logRef) {
                        html += '<div class="timeline-log-ref">' +
                            '<details>' +
                                '<summary>📄 ' + escapeHtml(logRef.filename) + ' (line ' + logRef.lineNumber + ')</summary>' +
                                '<div class="log-ref-content">' + escapeHtml(logRef.content) + '</div>' +
                            '</details>' +
                        '</div>';
                    } else if (sourceFile) {
                        html += '<div class="timeline-source">Source: ' + escapeHtml(sourceFile) + '</div>';
                    }
                    
                    html += '</div></div>';
                });
                
                html += '</div></div>';
            }

            if (issues.length > 0) {
                html += '<div style="margin-top: 20px;"><strong>Issues Detected:</strong></div>';
                issues.forEach((issue, index) => {
                    const logEntries = issue.log_entries || [];
                    const severity = issue.severity || 'Info';
                    const title = issue.title || 'Unknown Issue';
                    const description = issue.description || '';
                    const severityIcon = severity === 'Critical' ? '🔴' : severity === 'Warning' ? '⚠️' : 'ℹ️';
                    
                    html += '<div class="issue ' + String(severity).toLowerCase() + '">' +
                        '<div class="issue-title">' + severityIcon + ' ' + escapeHtml(title) + '</div>' +
                        '<div class="issue-description">' + escapeHtml(description) + '</div>';
                    
                    if (issue.remediation) {
                        html += '<div class="issue-remediation">' +
                            '<strong>Remediation:</strong>' +
                            formatRemediation(issue.remediation) +
                            '</div>';
                    }
                    
                    if (logEntries.length > 0) {
                        html += '<div class="log-evidence"><details>' +
                            '<summary>📋 View Log Evidence (' + logEntries.length + ' entries)</summary>';
                        
                        logEntries.forEach(entry => {
                            html += '<div class="log-entry">' +
                                '<div class="log-entry-header">📄 ' + escapeHtml(entry.filename) + ' (line ' + (entry.lineNumber || 0) + ')</div>' +
                                '<div class="log-entry-content">' + escapeHtml(entry.content) + '</div>' +
                                '</div>';
                        });
                        
                        html += '</details></div>';
                    }
                    
                    html += '</div>';
                });
            }

            if (analysis.recommendations && analysis.recommendations.length > 0) {
                html += '<div style="margin-top: 20px;"><strong>Recommendations:</strong></div>';
                html += '<ul style="margin-left: 20px; margin-top: 10px;">';
                analysis.recommendations.forEach(rec => {
                    html += '<li style="margin-bottom: 5px;">' + escapeHtml(rec) + '</li>';
                });
                html += '</ul>';
            }

            html += '<details style="margin-top: 20px;">' +
                '<summary style="cursor: pointer; font-weight: 600; margin-bottom: 10px;">View Raw JSON Response</summary>' +
                '<pre>' + JSON.stringify(data, null, 2) + '</pre>' +
                '</details>';
            
            results.innerHTML = html;
        }
        
        } catch (error) {
            console.error('Script error:', error);
            alert('JavaScript error: ' + error.message + '. Please check the console for details.');
        }
    </script>
    </div>
    </div>
</body>
</html>`;
