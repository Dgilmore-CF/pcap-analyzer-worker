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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 40px;
            max-width: 900px;
            width: 100%;
        }
        
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 28px;
        }
        
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 14px;
        }
        
        .tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            border-bottom: 2px solid #e0e0e0;
        }
        
        .tab {
            padding: 10px 20px;
            background: none;
            border: none;
            cursor: pointer;
            color: #666;
            font-size: 16px;
            font-weight: 500;
            border-bottom: 3px solid transparent;
            transition: all 0.3s;
        }
        
        .tab.active {
            color: #667eea;
            border-bottom-color: #667eea;
        }
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
        }
        
        .upload-area {
            border: 2px dashed #667eea;
            border-radius: 8px;
            padding: 40px;
            text-align: center;
            margin-bottom: 20px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .upload-area:hover {
            border-color: #764ba2;
            background: #f8f9ff;
        }
        
        .upload-area.dragover {
            border-color: #764ba2;
            background: #f0f2ff;
        }
        
        input[type="file"] {
            display: none;
        }
        
        .upload-icon {
            font-size: 48px;
            margin-bottom: 10px;
        }
        
        .upload-text {
            color: #666;
            font-size: 14px;
        }
        
        button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 14px 28px;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s ease;
            width: 100%;
        }
        
        button:hover:not(:disabled) {
            transform: translateY(-2px);
        }
        
        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .selected-files {
            margin: 20px 0;
            padding: 15px;
            background: #f8f9ff;
            border-radius: 6px;
        }
        
        .file-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .file-item:last-child {
            border-bottom: none;
        }
        
        .file-name {
            font-size: 14px;
            color: #333;
        }
        
        .file-size {
            font-size: 12px;
            color: #999;
        }
        
        .loading {
            display: none;
            text-align: center;
            padding: 20px;
        }
        
        .loading.active {
            display: block;
        }
        
        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
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
            margin-top: 30px;
            padding: 20px;
            background: #f8f9ff;
            border-radius: 8px;
            display: none;
        }
        
        .results.active {
            display: block;
        }
        
        .result-header {
            font-size: 18px;
            font-weight: 600;
            color: #333;
            margin-bottom: 15px;
        }
        
        .health-status {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 15px;
        }
        
        .health-status.healthy {
            background: #d4edda;
            color: #155724;
        }
        
        .health-status.degraded {
            background: #fff3cd;
            color: #856404;
        }
        
        .health-status.critical {
            background: #f8d7da;
            color: #721c24;
        }
        
        .issue {
            background: white;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 6px;
            border-left: 4px solid #667eea;
        }
        
        .issue.critical {
            border-left-color: #dc3545;
        }
        
        .issue.warning {
            border-left-color: #ffc107;
        }
        
        .issue-title {
            font-weight: 600;
            margin-bottom: 5px;
            color: #333;
        }
        
        .issue-description {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
        }
        
        .issue-remediation {
            font-size: 13px;
            color: #555;
            background: #f0f2ff;
            padding: 10px;
            border-radius: 4px;
        }
        
        pre {
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 15px;
            border-radius: 6px;
            overflow-x: auto;
            font-size: 12px;
            margin-top: 15px;
            max-height: 400px;
        }
        
        .error {
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 6px;
            margin-top: 15px;
            display: none;
        }
        
        .error.active {
            display: block;
        }
        
        .api-info {
            background: #f8f9ff;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .api-info h3 {
            color: #667eea;
            margin-bottom: 10px;
        }
        
        .api-info code {
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 13px;
        }
        
        .api-info pre {
            margin-top: 10px;
        }
        
        .endpoint-badge {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 12px;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 WARP Diagnostics Analyzer</h1>
        <p class="subtitle">AI-powered analysis using Llama 4 Scout 17B</p>
        
        <div class="tabs">
            <button class="tab active" data-tab="upload">Upload & Analyze</button>
            <button class="tab" data-tab="api">API Documentation</button>
        </div>
        
        <div id="upload-tab" class="tab-content active">
            <div class="upload-area" id="uploadArea">
                <div class="upload-icon">📁</div>
                <div class="upload-text">
                    Click or drag files here<br>
                    <small>Supports: .zip (warp-diag), .pcap, .log, .txt, .json</small>
                </div>
                <input type="file" id="fileInput" multiple accept=".zip,.pcap,.log,.txt,.json">
            </div>
            
            <div class="selected-files" id="selectedFiles" style="display: none;">
                <strong>Selected Files:</strong>
                <div id="fileList"></div>
            </div>
            
            <button id="analyzeBtn" disabled>Analyze Files</button>
            
            <div class="loading" id="loading">
                <div class="spinner"></div>
                <p>Analyzing with AI... This may take a few seconds</p>
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
        const currentUrl = window.location.origin;
        
        // Update API documentation with current URL
        document.getElementById('apiEndpoint').textContent = currentUrl;
        document.getElementById('curlUrl').textContent = currentUrl;
        document.getElementById('jsUrl').textContent = currentUrl;
        document.getElementById('getUrl').textContent = currentUrl;
        
        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                tab.classList.add('active');
                document.getElementById(tabName + '-tab').classList.add('active');
            });
        });
        
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const analyzeBtn = document.getElementById('analyzeBtn');
        const selectedFiles = document.getElementById('selectedFiles');
        const fileList = document.getElementById('fileList');
        const loading = document.getElementById('loading');
        const results = document.getElementById('results');
        const errorDiv = document.getElementById('error');

        let files = [];

        uploadArea.addEventListener('click', () => fileInput.click());

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
                return;
            }

            selectedFiles.style.display = 'block';
            analyzeBtn.disabled = false;

            fileList.innerHTML = files.map(file => \`
                <div class="file-item">
                    <span class="file-name">\${file.name}</span>
                    <span class="file-size">\${formatBytes(file.size)}</span>
                </div>
            \`).join('');
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

            try {
                const formData = new FormData();
                files.forEach((file, index) => {
                    formData.append(\`file\${index}\`, file);
                });

                const response = await fetch(currentUrl, {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Analysis failed');
                }

                const data = await response.json();
                displayResults(data);
            } catch (error) {
                showError(error.message);
            } finally {
                loading.classList.remove('active');
                analyzeBtn.disabled = false;
            }
        });

        function showError(message) {
            errorDiv.textContent = '❌ Error: ' + message;
            errorDiv.classList.add('active');
        }

        function displayResults(data) {
            results.classList.add('active');
            
            const analysis = data.analysis || {};
            const healthStatus = analysis.health_status || 'Unknown';
            const issues = analysis.issues || [];

            let html = \`
                <div class="result-header">Analysis Results</div>
                <div class="health-status \${healthStatus.toLowerCase()}">\${healthStatus}</div>
                <p><strong>Summary:</strong> \${analysis.summary || 'No summary available'}</p>
                <p style="margin-top: 10px; font-size: 14px; color: #666;">
                    Files Processed: \${data.filesProcessed?.total || 0} | 
                    Files Analyzed: \${data.filesAnalyzed || 0} | 
                    Model: \${data.modelUsed || 'Unknown'}
                </p>
            \`;

            if (issues.length > 0) {
                html += '<div style="margin-top: 20px;"><strong>Issues Detected:</strong></div>';
                issues.forEach(issue => {
                    html += \`
                        <div class="issue \${issue.severity.toLowerCase()}">
                            <div class="issue-title">
                                \${issue.severity === 'Critical' ? '🔴' : issue.severity === 'Warning' ? '⚠️' : 'ℹ️'}
                                \${issue.title}
                            </div>
                            <div class="issue-description">\${issue.description}</div>
                            \${issue.remediation ? \`
                                <div class="issue-remediation">
                                    <strong>Remediation:</strong><br>\${issue.remediation}
                                </div>
                            \` : ''}
                        </div>
                    \`;
                });
            }

            if (analysis.recommendations && analysis.recommendations.length > 0) {
                html += '<div style="margin-top: 20px;"><strong>Recommendations:</strong></div>';
                html += '<ul style="margin-left: 20px; margin-top: 10px;">';
                analysis.recommendations.forEach(rec => {
                    html += \`<li style="margin-bottom: 5px;">\${rec}</li>\`;
                });
                html += '</ul>';
            }

            html += \`<details style="margin-top: 20px;">
                <summary style="cursor: pointer; font-weight: 600; margin-bottom: 10px;">View Raw JSON Response</summary>
                <pre>\${JSON.stringify(data, null, 2)}</pre>
            </details>\`;
            
            results.innerHTML = html;
        }
    </script>
</body>
</html>`;
