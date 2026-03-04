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
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #f5f5f5;
            min-height: 100vh;
            padding: 0;
            margin: 0;
        }
        
        .header {
            background: #ffffff;
            border-bottom: 1px solid #e0e0e0;
            padding: 20px 0;
            margin-bottom: 0;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
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
            color: #1a1a1a;
            font-size: 24px;
            font-weight: 600;
            margin: 0;
            letter-spacing: -0.3px;
        }
        
        .header-badge {
            background: #F38020;
            color: white;
            padding: 5px 14px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }
        
        .main-wrapper {
            padding: 40px 30px;
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .container {
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border: 1px solid #e0e0e0;
            padding: 40px;
            width: 100%;
            margin-bottom: 30px;
        }
        
        .tabs {
            display: flex;
            gap: 0;
            margin-bottom: 32px;
            border-bottom: 2px solid #e0e0e0;
        }
        
        .tab {
            padding: 14px 24px;
            background: transparent;
            border: none;
            cursor: pointer;
            color: #666;
            font-size: 15px;
            font-weight: 500;
            border-bottom: 3px solid transparent;
            transition: all 0.2s;
            position: relative;
            margin-bottom: -2px;
        }
        
        .tab:hover {
            color: #F38020;
            background: #fafafa;
        }
        
        .tab.active {
            color: #F38020;
            border-bottom-color: #F38020;
            font-weight: 600;
        }
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
        }
        
        .upload-area {
            border: 2px dashed #d0d0d0;
            border-radius: 8px;
            padding: 60px 40px;
            text-align: center;
            margin-bottom: 24px;
            cursor: pointer;
            transition: all 0.2s ease;
            background: #fafafa;
        }
        
        .upload-area:hover {
            border-color: #F38020;
            background: white;
            box-shadow: 0 4px 12px rgba(243, 128, 32, 0.1);
        }
        
        .upload-area.dragover {
            border-color: #F38020;
            background: #fff5ed;
            border-style: solid;
        }
        
        input[type="file"] {
            display: none;
        }
        
        .upload-icon {
            font-size: 48px;
            margin-bottom: 16px;
        }
        
        .upload-text {
            color: #666;
            font-size: 15px;
            font-weight: 400;
            line-height: 1.6;
        }
        
        .upload-text strong {
            color: #1a1a1a;
            font-weight: 600;
        }
        
        .upload-text small {
            display: block;
            margin-top: 8px;
            color: #999;
            font-size: 13px;
        }
        
        button {
            background: #F38020;
            color: white;
            border: none;
            padding: 14px 28px;
            border-radius: 4px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            width: 100%;
        }
        
        button:hover:not(:disabled) {
            background: #d66e1a;
        }
        
        button:active:not(:disabled) {
            background: #c45e10;
        }
        
        button:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        
        .selected-files {
            margin: 24px 0;
            padding: 20px;
            background: #fafafa;
            border-radius: 6px;
            border: 1px solid #e0e0e0;
        }
        
        .selected-files strong {
            color: #1a1a1a;
            font-size: 14px;
            font-weight: 600;
            display: block;
            margin-bottom: 12px;
        }
        
        .file-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .file-item:last-child {
            border-bottom: none;
        }
        
        .file-name {
            font-size: 14px;
            color: #1a1a1a;
            font-weight: 500;
        }
        
        .file-size {
            font-size: 13px;
            color: #999;
        }
        
        .loading {
            display: none;
            text-align: center;
            padding: 30px;
            color: #666;
        }
        
        .loading.active {
            display: block;
        }
        
        .progress-container {
            width: 100%;
            height: 8px;
            background-color: #e0e0e0;
            border-radius: 4px;
            margin: 20px 0 10px 0;
            overflow: hidden;
        }
        
        .progress-bar {
            height: 100%;
            background: #F38020;
            border-radius: 4px;
            width: 0;
            transition: width 0.3s ease;
        }
        
        .progress-status {
            font-size: 14px;
            color: #666;
            margin-top: 8px;
            min-height: 20px;
        }
        
        .pcap-options {
            margin: 24px 0;
            padding: 20px;
            background: #fafafa;
            border-radius: 6px;
            border: 1px solid #e0e0e0;
        }
        
        .pcap-options label {
            display: block;
            margin-bottom: 10px;
            color: #1a1a1a;
            font-weight: 600;
            font-size: 14px;
        }
        
        .packet-count-select {
            width: 100%;
            padding: 10px 12px;
            font-size: 14px;
            border: 1px solid #d0d0d0;
            border-radius: 4px;
            background-color: white;
            cursor: pointer;
            transition: border-color 0.2s;
            color: #1a1a1a;
        }
        
        .packet-count-select:hover {
            border-color: #F38020;
        }
        
        .packet-count-select:focus {
            outline: none;
            border-color: #F38020;
            box-shadow: 0 0 0 2px rgba(243, 128, 32, 0.1);
        }
        
        .spinner {
            border: 3px solid #f0f0f0;
            border-top: 3px solid #F38020;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px;
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
            font-size: 24px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 20px;
        }
        
        .health-status {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 4px;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .health-status.healthy {
            background: #d1f5d3;
            color: #0f7a1c;
        }
        
        .health-status.degraded {
            background: #ffe8b8;
            color: #8a5700;
        }
        
        .health-status.critical {
            background: #ffd4d4;
            color: #c41e3a;
        }
        
        .issue {
            background: white;
            padding: 20px;
            margin-bottom: 15px;
            border-radius: 6px;
            border-left: 4px solid #0051c3;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            border: 1px solid #e0e0e0;
            border-left: 4px solid #0051c3;
        }
        
        .issue.critical {
            border-left-color: #c41e3a;
        }
        
        .issue.warning {
            border-left-color: #F38020;
        }
        
        .issue-title {
            font-weight: 600;
            margin-bottom: 10px;
            color: #1a1a1a;
            font-size: 16px;
        }
        
        .issue-description {
            font-size: 14px;
            color: #666;
            margin-bottom: 12px;
            line-height: 1.6;
        }
        
        .issue-remediation {
            font-size: 14px;
            color: #1a1a1a;
            background: #fafafa;
            padding: 15px;
            border-radius: 4px;
            border-left: 3px solid #F38020;
        }
        
        .issue-remediation strong {
            color: #1a1a1a;
            font-weight: 600;
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
            background: #ffd4d4;
            color: #c41e3a;
            padding: 16px 20px;
            border-radius: 4px;
            margin-top: 15px;
            display: none;
            border-left: 4px solid #c41e3a;
        }
        
        .error.active {
            display: block;
        }
        
        .api-info {
            background: #fafafa;
            padding: 24px;
            border-radius: 6px;
            margin-bottom: 20px;
            border: 1px solid #e0e0e0;
        }
        
        .api-info h3 {
            color: #1a1a1a;
            margin-bottom: 12px;
            font-size: 18px;
            font-weight: 600;
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
            margin-top: 30px;
            margin-bottom: 30px;
            background: #fafafa;
            padding: 25px;
            border-radius: 6px;
            border: 1px solid #e0e0e0;
        }
        
        .timeline-header {
            font-size: 20px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 2px solid #F38020;
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
            width: 2px;
            background: #F38020;
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
            left: -33px;
            top: 0;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: white;
            border: 3px solid #F38020;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
            background: white;
            padding: 15px;
            border-radius: 6px;
            border-left: 3px solid #F38020;
            box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }
        
        .timeline-event.critical .timeline-content {
            border-left-color: #c41e3a;
        }
        
        .timeline-event.warning .timeline-content {
            border-left-color: #f39c12;
        }
        
        .timeline-event.success .timeline-content {
            border-left-color: #27ae60;
        }
        
        .timeline-timestamp {
            font-size: 12px;
            color: #666;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            margin-bottom: 6px;
            font-weight: 500;
        }
        
        .timeline-event-title {
            font-size: 15px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 8px;
        }
        
        .timeline-details {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
            line-height: 1.5;
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
