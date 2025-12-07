/**
 * AI-powered analysis using Cloudflare Workers AI
 */

const MODELS = {
	LLAMA4_SCOUT: '@cf/meta/llama-4-scout-17b-16e-instruct',
	LLAMA33_FAST: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
	DEEPSEEK_R1: '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
};

/**
 * System prompt for WARP diagnostics analysis
 */
const WARP_DIAGNOSTICS_PROMPT = `You are an expert Cloudflare WARP network diagnostics analyzer. Your task is to analyze WARP client logs, network configurations, and packet captures to identify connectivity issues, performance problems, and configuration errors.

When analyzing logs:
1. Identify root causes, not just symptoms
2. Classify issues by severity (Critical, Warning, Info)
3. Provide specific, actionable remediation steps as numbered lists (e.g., "1. First step 2. Second step")
4. Note relevant timestamps and sequences of events
5. Highlight patterns that indicate common problems

Common WARP issues to look for:
- Connection failures (tunnel establishment, authentication)
- DNS resolution problems
- Routing conflicts
- Certificate/TLS issues
- Split tunnel configuration problems
- Performance degradation (high latency, packet loss)
- Firewall blocking
- Network interface conflicts
- Configuration mismatches

Respond with structured JSON output.`;

/**
 * Analyze WARP diagnostic logs using AI
 * @param {Object} ai - Workers AI binding
 * @param {Array} logFiles - Array of {filename, content, category} objects
 * @param {Object} pcapMetadata - PCAP file metadata
 * @returns {Promise<Object>} - Analysis results
 */
export async function analyzeWarpDiagnostics(ai, logFiles, pcapMetadata) {
	// Prepare context for AI analysis
	const context = buildAnalysisContext(logFiles, pcapMetadata);

	// Create analysis prompt
	const userPrompt = `Analyze the following Cloudflare WARP diagnostic data and provide a comprehensive report.

## Files Included
${logFiles.map(f => `- ${f.filename} (${f.category})`).join('\n')}

${pcapMetadata ? `## PCAP Metadata\n${JSON.stringify(pcapMetadata, null, 2)}\n` : ''}

## Key Log Content
${context.keyLogs}

## Network Configuration
${context.networkConfig}

## Connection Status
${context.connectionInfo}

Please provide:
1. Overall assessment of WARP client health
2. Detected issues with severity levels (Critical/Warning/Info)
3. Root cause analysis for each issue
4. Specific remediation steps
5. Timeline of key events

Format your response as JSON with this structure:
{
  "summary": "Brief overall assessment",
  "health_status": "Healthy|Degraded|Critical",
  "issues": [
    {
      "severity": "Critical|Warning|Info",
      "category": "Connection|DNS|Performance|Configuration|Security",
      "title": "Issue title",
      "description": "Detailed description",
      "root_cause": "Root cause analysis",
      "remediation": "Numbered remediation steps (format: '1. First step 2. Second step 3. Third step')",
      "affected_files": ["file1.log", "file2.txt"],
      "timestamps": ["timestamp1", "timestamp2"],
      "evidence_keywords": ["keyword1", "keyword2", "error phrase"]
    }
  ],
  "timeline": [
    {
      "timestamp": "ISO timestamp or log timestamp",
      "event": "Event description",
      "severity": "Critical|Warning|Info"
    }
  ],
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2"
  ]
}`;

	try {
		// Use Llama 4 Scout with function calling for structured output
		const response = await ai.run(MODELS.LLAMA4_SCOUT, {
			messages: [
				{ role: 'system', content: WARP_DIAGNOSTICS_PROMPT },
				{ role: 'user', content: userPrompt }
			],
			temperature: 0.1, // Low temperature for deterministic technical analysis
			max_tokens: 4096,
		});

		// Parse AI response
		const result = parseAIResponse(response);
		
		// Enrich issues with actual log evidence
		if (result.issues) {
			result.issues = result.issues.map(issue => enrichIssueWithLogEvidence(issue, logFiles));
		}
		
		return {
			success: true,
			analysis: result,
			model: MODELS.LLAMA4_SCOUT,
			filesAnalyzed: logFiles.length,
		};
	} catch (error) {
		console.error('AI analysis failed:', error);
		return {
			success: false,
			error: error.message,
			fallback: generateFallbackAnalysis(logFiles, pcapMetadata),
		};
	}
}

/**
 * Build analysis context from log files
 * @param {Array} logFiles
 * @param {Object} pcapMetadata
 * @returns {Object} - Structured context
 */
function buildAnalysisContext(logFiles, pcapMetadata) {
	const context = {
		keyLogs: '',
		networkConfig: '',
		connectionInfo: '',
	};

	// Extract high-priority content
	for (const file of logFiles) {
		const maxLength = 3000; // Limit per file to stay within token limits
		const truncatedContent = file.content.length > maxLength 
			? file.content.substring(0, maxLength) + '\n... (truncated)'
			: file.content;

		if (file.category === 'connection') {
			context.connectionInfo += `\n### ${file.filename}\n${truncatedContent}\n`;
		} else if (file.category === 'network') {
			context.networkConfig += `\n### ${file.filename}\n${truncatedContent}\n`;
		} else if (file.category === 'dns' || file.category === 'config') {
			context.keyLogs += `\n### ${file.filename}\n${truncatedContent}\n`;
		}
	}

	return context;
}

/**
 * Enrich issue with relevant log evidence
 * @param {Object} issue - Issue object from AI analysis
 * @param {Array} logFiles - Array of log file objects
 * @returns {Object} - Issue enriched with log_entries
 */
function enrichIssueWithLogEvidence(issue, logFiles) {
	const logEntries = [];
	const maxEntriesPerFile = 10; // Limit entries per file
	const maxLineLength = 500; // Truncate very long lines
	
	// Get keywords to search for
	const keywords = issue.evidence_keywords || [];
	const affectedFiles = issue.affected_files || [];
	
	// If no specific files mentioned, search all files
	const filesToSearch = affectedFiles.length > 0 
		? logFiles.filter(f => affectedFiles.some(af => f.filename.includes(af)))
		: logFiles;
	
	for (const file of filesToSearch) {
		const lines = file.content.split('\n');
		const matchedLines = [];
		
		// Search for lines containing keywords or timestamps
		for (let i = 0; i < lines.length && matchedLines.length < maxEntriesPerFile; i++) {
			const line = lines[i];
			const lowerLine = line.toLowerCase();
			
			// Check if line contains any keyword
			const hasKeyword = keywords.some(kw => lowerLine.includes(kw.toLowerCase()));
			
			// Also check for error/warning indicators
			const hasError = lowerLine.includes('error') || 
			                 lowerLine.includes('fail') || 
			                 lowerLine.includes('warning') ||
			                 lowerLine.includes('critical');
			
			// Check for timestamps mentioned in issue
			const hasTimestamp = issue.timestamps && 
			                     issue.timestamps.some(ts => line.includes(ts));
			
			if (hasKeyword || hasTimestamp || (hasError && keywords.length === 0)) {
				// Include context: previous and next line
				const contextLines = [];
				if (i > 0) contextLines.push(lines[i - 1]);
				contextLines.push(line);
				if (i < lines.length - 1) contextLines.push(lines[i + 1]);
				
				const entry = contextLines.join('\n');
				const truncated = entry.length > maxLineLength 
					? entry.substring(0, maxLineLength) + '...'
					: entry;
				
				matchedLines.push({
					filename: file.filename,
					lineNumber: i + 1,
					content: truncated
				});
			}
		}
		
		logEntries.push(...matchedLines);
	}
	
	// Return issue with log_entries added
	return {
		...issue,
		log_entries: logEntries.slice(0, 20) // Limit total entries to 20
	};
}

/**
 * Parse AI response and extract JSON
 * @param {Object} response - AI model response
 * @returns {Object} - Parsed analysis
 */
function parseAIResponse(response) {
	try {
		// Extract response text
		let text = '';
		if (response.response) {
			text = response.response;
		} else if (response.result && response.result.response) {
			text = response.result.response;
		} else if (typeof response === 'string') {
			text = response;
		}

		// Try to extract JSON from response
		const jsonMatch = text.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			return JSON.parse(jsonMatch[0]);
		}

		// If no JSON found, return structured fallback
		return {
			summary: text,
			health_status: 'Unknown',
			issues: [],
			timeline: [],
			recommendations: []
		};
	} catch (error) {
		console.error('Failed to parse AI response:', error);
		return {
			summary: 'Analysis completed but response parsing failed',
			health_status: 'Unknown',
			issues: [],
			timeline: [],
			recommendations: [],
			raw_response: String(response)
		};
	}
}

/**
 * Generate fallback analysis without AI
 * @param {Array} logFiles
 * @param {Object} pcapMetadata
 * @returns {Object} - Basic analysis
 */
function generateFallbackAnalysis(logFiles, pcapMetadata) {
	const issues = [];

	// Check for common issues in files
	for (const file of logFiles) {
		const content = file.content.toLowerCase();

		// Check for connection failures
		if (content.includes('failed to connect') || content.includes('connection refused')) {
			issues.push({
				severity: 'Critical',
				category: 'Connection',
				title: 'Connection failure detected',
				description: `Connection issues found in ${file.filename}`,
				root_cause: 'Unable to establish tunnel connection',
				remediation: '1. Check network connectivity 2. Verify firewall rules allow WARP traffic 3. Restart WARP client',
				affected_files: [file.filename],
				evidence_keywords: ['failed to connect', 'connection refused']
			});
		}

		// Check for DNS issues
		if (content.includes('dns timeout') || content.includes('nxdomain')) {
			issues.push({
				severity: 'Warning',
				category: 'DNS',
				title: 'DNS resolution problems',
				description: `DNS errors found in ${file.filename}`,
				root_cause: 'DNS resolver not responding or domain not found',
				remediation: '1. Verify DNS settings in WARP configuration 2. Check network DNS configuration 3. Test with different DNS resolver',
				affected_files: [file.filename],
				evidence_keywords: ['dns timeout', 'nxdomain']
			});
		}

		// Check for certificate issues
		if (content.includes('certificate') && (content.includes('invalid') || content.includes('expired'))) {
			issues.push({
				severity: 'Critical',
				category: 'Security',
				title: 'Certificate validation failure',
				description: `Certificate issues in ${file.filename}`,
				root_cause: 'Invalid or expired TLS certificate',
				remediation: '1. Ensure root certificate is properly installed 2. Update system certificates 3. Verify system time and date are correct',
				affected_files: [file.filename],
				evidence_keywords: ['certificate', 'invalid', 'expired']
			});
		}
	}

	// Enrich fallback issues with log evidence
	const enrichedIssues = issues.map(issue => enrichIssueWithLogEvidence(issue, logFiles));

	return {
		summary: `Fallback analysis: Processed ${logFiles.length} files. ${issues.length} issues detected.`,
		health_status: issues.some(i => i.severity === 'Critical') ? 'Critical' : 
		               issues.length > 0 ? 'Degraded' : 'Healthy',
		issues: enrichedIssues,
		timeline: [],
		recommendations: [
			'Review detailed logs for more information',
			'Check Cloudflare WARP documentation for common issues',
			'Contact support if problems persist'
		],
		note: 'This is a basic rule-based analysis. Full AI analysis failed.'
	};
}

/**
 * Analyze PCAP files with AI
 * @param {Object} ai - Workers AI binding
 * @param {Object} pcapMetadata - PCAP metadata
 * @param {string} pcapSummary - Summary of PCAP contents
 * @returns {Promise<Object>} - Analysis results
 */
export async function analyzePcapWithAI(ai, pcapMetadata, pcapSummary) {
	const prompt = `Analyze this network packet capture data from a Cloudflare WARP tunnel:

${JSON.stringify(pcapMetadata, null, 2)}

${pcapSummary}

Identify:
1. Network protocol issues
2. Packet loss or retransmission patterns
3. Connection quality problems
4. Security concerns
5. Performance bottlenecks

Respond in JSON format with findings and recommendations.`;

	try {
		const response = await ai.run(MODELS.LLAMA4_SCOUT, {
			messages: [
				{ role: 'system', content: 'You are a network packet analysis expert.' },
				{ role: 'user', content: prompt }
			],
			temperature: 0.1,
			max_tokens: 2048,
		});

		return {
			success: true,
			analysis: parseAIResponse(response),
			model: MODELS.LLAMA4_SCOUT
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
			fallback: {
				summary: `PCAP analysis: ${pcapMetadata.packetCount} packets captured`,
				metadata: pcapMetadata
			}
		};
	}
}
