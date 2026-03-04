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
6. For evidence_keywords, include EXACT phrases, error messages, IP addresses, packet numbers, or distinctive text from the log lines that support your findings

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
- Packet-level issues (retransmissions, drops, protocol errors)
- Network protocol anomalies (TCP resets, ICMP errors, ARP issues)

When analyzing PCAP packet data, include specific packet numbers (e.g., "Packet 15"), timestamps, IP addresses, port numbers, and protocol details in your evidence keywords.

IMPORTANT: Your evidence_keywords should contain exact phrases and distinctive text that appear in the log lines. These will be used to extract and display the actual log entries to the user. Be specific - use actual error messages, IP addresses, packet identifiers, and unique strings from the logs.

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
5. **Detailed timeline of key events** - chronologically ordered sequence showing:
   - Connection attempts and results
   - Configuration changes
   - Error occurrences
   - State transitions (connected → disconnected, etc.)
   - Network events (DNS lookups, packet issues, etc.)
   - Include the source filename and approximate line reference for each event

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
      "event_type": "Connection|Configuration|Error|State|Network|Info",
      "severity": "Critical|Warning|Info|Success",
      "source_file": "filename.log",
      "details": "Additional context or exact log message"
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
		
		// Enrich timeline events with actual log lines
		if (result.timeline) {
			result.timeline = enrichTimelineWithLogReferences(result.timeline, logFiles);
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

	// Process ALL log files and include line numbers for better evidence extraction
	for (const file of logFiles) {
		const maxLength = 4000; // Increased limit per file
		const lines = file.content.split('\n');
		
		// Add line numbers to make evidence extraction more precise
		let numberedContent = '';
		let charCount = 0;
		
		for (let i = 0; i < lines.length && charCount < maxLength; i++) {
			const line = lines[i];
			if (line.trim()) { // Skip empty lines
				numberedContent += `[Line ${i + 1}] ${line}\n`;
				charCount += line.length;
			}
		}
		
		if (charCount >= maxLength) {
			numberedContent += '... (truncated - more lines available)\n';
		}

		// Categorize content for better organization
		if (file.category === 'connection') {
			context.connectionInfo += `\n### ${file.filename}\n${numberedContent}\n`;
		} else if (file.category === 'network') {
			context.networkConfig += `\n### ${file.filename}\n${numberedContent}\n`;
		} else if (file.category === 'pcap') {
			// PCAP files are critical for network issues
			context.keyLogs += `\n### ${file.filename} (PCAP Analysis)\n${numberedContent}\n`;
		} else {
			// Include all other categories (dns, config, logs, etc.)
			context.keyLogs += `\n### ${file.filename}\n${numberedContent}\n`;
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
	const maxEntriesPerFile = 15; // Increased to show more relevant evidence
	const maxLineLength = 800; // Increased to show more complete information
	
	// Get keywords to search for
	const keywords = issue.evidence_keywords || [];
	const affectedFiles = issue.affected_files || [];
	const timestamps = issue.timestamps || [];
	
	// If no specific files mentioned, search all files
	const filesToSearch = affectedFiles.length > 0 
		? logFiles.filter(f => affectedFiles.some(af => f.filename.includes(af)))
		: logFiles;
	
	// Track matched lines to avoid duplicates
	const seenLines = new Set();
	
	for (const file of filesToSearch) {
		const lines = file.content.split('\n');
		const matchedLines = [];
		
		// Search for lines containing keywords or timestamps
		for (let i = 0; i < lines.length && matchedLines.length < maxEntriesPerFile; i++) {
			const line = lines[i];
			const lowerLine = line.toLowerCase();
			const lineKey = `${file.filename}:${i}`;
			
			// Skip if we've already matched this line
			if (seenLines.has(lineKey)) continue;
			
			let matchScore = 0;
			let matchReasons = [];
			
			// Check if line contains any keyword (case-insensitive, partial match)
			for (const kw of keywords) {
				if (!kw) continue;
				const kwLower = String(kw).toLowerCase();
				if (lowerLine.includes(kwLower)) {
					matchScore += 10;
					matchReasons.push(`keyword: ${kw}`);
				}
			}
			
			// Check for timestamps mentioned in issue
			for (const ts of timestamps) {
				if (line.includes(ts)) {
					matchScore += 8;
					matchReasons.push(`timestamp: ${ts}`);
				}
			}
			
			// Check for error/warning indicators (lower priority)
			if (lowerLine.includes('error') || lowerLine.includes('fail')) {
				matchScore += 3;
				matchReasons.push('error indicator');
			}
			if (lowerLine.includes('warning') || lowerLine.includes('warn')) {
				matchScore += 2;
				matchReasons.push('warning indicator');
			}
			if (lowerLine.includes('critical')) {
				matchScore += 4;
				matchReasons.push('critical indicator');
			}
			
			// Special handling for PCAP files - look for packet numbers, IPs, ports
			if (file.category === 'pcap') {
				if (lowerLine.includes('[packet') || lowerLine.includes('packet ')) {
					matchScore += 5;
				}
				// Match IP patterns
				for (const kw of keywords) {
					if (String(kw).match(/\d+\.\d+\.\d+\.\d+/)) {
						if (line.includes(kw)) {
							matchScore += 12; // High priority for IP matches
						}
					}
				}
			}
			
			// If we have a match, extract it with context
			if (matchScore > 0 || (keywords.length === 0 && matchReasons.length > 0)) {
				seenLines.add(lineKey);
				
				// Include context: 1-2 lines before and after
				const contextLines = [];
				const contextBefore = 2;
				const contextAfter = 2;
				
				for (let j = Math.max(0, i - contextBefore); j <= Math.min(lines.length - 1, i + contextAfter); j++) {
					if (lines[j].trim()) {
						const prefix = j === i ? '>>> ' : '    ';
						contextLines.push(prefix + lines[j]);
					}
				}
				
				const entry = contextLines.join('\n');
				const truncated = entry.length > maxLineLength 
					? entry.substring(0, maxLineLength) + '...\n[line truncated]'
					: entry;
				
				matchedLines.push({
					filename: file.filename,
					lineNumber: i + 1,
					content: truncated,
					matchScore: matchScore
				});
			}
		}
		
		// Sort by match score (highest first) and add to results
		matchedLines.sort((a, b) => b.matchScore - a.matchScore);
		logEntries.push(...matchedLines);
	}
	
	// Return issue with log_entries added, prioritizing best matches
	return {
		...issue,
		log_entries: logEntries.slice(0, 30) // Increased limit to show more evidence
	};
}

/**
 * Enrich timeline events with actual log references
 * @param {Array} timeline - Timeline events from AI
 * @param {Array} logFiles - Array of log file objects
 * @returns {Array} - Enriched timeline with log references
 */
function enrichTimelineWithLogReferences(timeline, logFiles) {
	return timeline.map(event => {
		const enrichedEvent = { ...event };
		
		// Try to find the actual log line for this event
		const searchTerms = [];
		
		// Add timestamp to search terms
		if (event.timestamp) {
			searchTerms.push(event.timestamp);
		}
		
		// Add key phrases from event description
		if (event.event) {
			const eventWords = event.event.toLowerCase().split(' ');
			// Look for distinctive words (longer than 4 chars)
			searchTerms.push(...eventWords.filter(w => w.length > 4));
		}
		
		// Add details if available
		if (event.details) {
			searchTerms.push(event.details);
		}
		
		// Determine which file to search
		const targetFiles = event.source_file 
			? logFiles.filter(f => f.filename.includes(event.source_file))
			: logFiles;
		
		// Find matching log lines
		let bestMatch = null;
		let bestScore = 0;
		
		for (const file of targetFiles) {
			const lines = file.content.split('\n');
			
			for (let i = 0; i < lines.length; i++) {
				const line = lines[i];
				const lowerLine = line.toLowerCase();
				
				let score = 0;
				
				// Score based on matching search terms
				for (const term of searchTerms) {
					if (term && lowerLine.includes(String(term).toLowerCase())) {
						score += 5;
					}
				}
				
				// Bonus for timestamp match
				if (event.timestamp && line.includes(event.timestamp)) {
					score += 20;
				}
				
				if (score > bestScore) {
					bestScore = score;
					bestMatch = {
						filename: file.filename,
						lineNumber: i + 1,
						content: line.trim()
					};
				}
			}
		}
		
		// Add log reference if found
		if (bestMatch) {
			enrichedEvent.log_reference = bestMatch;
		}
		
		return enrichedEvent;
	});
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
