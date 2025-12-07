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
3. Provide specific, actionable remediation steps
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
      "remediation": "Step-by-step fix",
      "affected_files": ["file1.log", "file2.txt"],
      "timestamps": ["timestamp1", "timestamp2"]
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
				remediation: 'Check network connectivity and firewall rules',
				affected_files: [file.filename]
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
				remediation: 'Verify DNS settings and network configuration',
				affected_files: [file.filename]
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
				remediation: 'Ensure root certificate is properly installed',
				affected_files: [file.filename]
			});
		}
	}

	return {
		summary: `Fallback analysis: Processed ${logFiles.length} files. ${issues.length} issues detected.`,
		health_status: issues.some(i => i.severity === 'Critical') ? 'Critical' : 
		               issues.length > 0 ? 'Degraded' : 'Healthy',
		issues,
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
