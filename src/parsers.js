import { unzipSync } from 'fflate';

/**
 * Extract files from a ZIP archive
 * @param {ArrayBuffer} zipData - ZIP file data
 * @returns {Map<string, Uint8Array>} - Map of filename to file content
 */
export function extractZipFiles(zipData) {
	try {
		const uint8Data = new Uint8Array(zipData);
		// Use unzipSync instead of unzip to avoid Web Worker dependency
		// which is not available in Cloudflare Workers runtime
		const files = unzipSync(uint8Data);
		const fileMap = new Map();
		for (const [filename, data] of Object.entries(files)) {
			fileMap.set(filename, data);
		}
		return fileMap;
	} catch (err) {
		throw new Error(`Failed to extract ZIP: ${err.message}`);
	}
}

/**
 * Parse text-based log files
 * @param {Uint8Array} data - File data
 * @returns {string} - Decoded text
 */
export function parseTextFile(data) {
	const decoder = new TextDecoder('utf-8');
	return decoder.decode(data);
}

/**
 * Parse PCAP file and extract basic metadata
 * Note: Full PCAP parsing requires binary analysis. This provides basic info.
 * @param {Uint8Array} data - PCAP file data
 * @returns {Object} - Basic PCAP metadata
 */
export function parsePcapBasic(data) {
	if (data.length < 24) {
		return { error: 'Invalid PCAP file: too small' };
	}

	// Read PCAP global header (24 bytes)
	const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
	const magicNumber = view.getUint32(0, true);
	
	// Check for PCAP magic numbers
	const isPcap = magicNumber === 0xa1b2c3d4 || magicNumber === 0xd4c3b2a1;
	const isPcapNg = magicNumber === 0x0a0d0d0a;
	
	if (!isPcap && !isPcapNg) {
		return { error: 'Invalid PCAP file: unrecognized magic number' };
	}

	const isLittleEndian = magicNumber === 0xa1b2c3d4;
	const versionMajor = view.getUint16(4, isLittleEndian);
	const versionMinor = view.getUint16(6, isLittleEndian);
	const snaplen = view.getUint32(16, isLittleEndian);
	const network = view.getUint32(20, isLittleEndian);

	// Count packets (simplified - just count packet headers)
	let packetCount = 0;
	let offset = 24;
	while (offset + 16 <= data.length) {
		try {
			const capturedLength = view.getUint32(offset + 8, isLittleEndian);
			packetCount++;
			offset += 16 + capturedLength;
		} catch {
			break;
		}
	}

	return {
		format: isPcapNg ? 'PCAPNG' : 'PCAP',
		version: `${versionMajor}.${versionMinor}`,
		snaplen,
		network,
		packetCount,
		fileSize: data.length,
	};
}

/**
 * Identify and categorize WARP diag files
 * @param {string} filename
 * @returns {Object} - File category and importance
 */
export function categorizeWarpFile(filename) {
	const categories = {
		connection: ['daemon.log', 'connectivity.txt', 'warp-status.txt', 'boringtun.log'],
		dns: ['daemon_dns.log', 'dns-check.txt', 'dns_stats.log', 'dig.txt', 'resolv.conf'],
		network: ['ifconfig.txt', 'ipconfig.txt', 'netstat.txt', 'route.txt', 'traceroute.txt'],
		config: ['warp-settings.txt', 'warp-account.txt', 'mdm.plist', 'mdm.xml'],
		system: ['sysinfo.json', 'platform.txt', 'version.txt', 'date.txt'],
		performance: ['stats.log', 'warp-stats.txt', 'warp-bus-metrics.txt'],
		security: ['warp-device-posture.txt', 'firewall-rules.txt', 'installed_cert.pem'],
		pcap: ['.pcap', '.qlog'],
	};

	for (const [category, patterns] of Object.entries(categories)) {
		if (patterns.some(pattern => filename.includes(pattern))) {
			return {
				category,
				priority: category === 'connection' || category === 'dns' ? 'high' : 'medium',
			};
		}
	}

	return { category: 'other', priority: 'low' };
}

/**
 * Extract key information from common WARP log files
 * @param {string} filename
 * @param {string} content
 * @returns {Object} - Structured key-value data
 */
export function extractKeyInfo(filename, content) {
	const info = {};

	try {
		// Parse warp-status.txt
		if (filename.includes('warp-status.txt')) {
			const lines = content.split('\n');
			for (const line of lines) {
				if (line.includes('Status:')) info.status = line.split(':')[1]?.trim();
				if (line.includes('Mode:')) info.mode = line.split(':')[1]?.trim();
			}
		}

		// Parse warp-settings.txt (JSON-like)
		if (filename.includes('warp-settings.txt')) {
			try {
				const settings = JSON.parse(content);
				info.settings = settings;
			} catch {
				// Not JSON, extract key-value pairs
				const matches = content.matchAll(/(\w+):\s*(.+)/g);
				for (const match of matches) {
					info[match[1]] = match[2].trim();
				}
			}
		}

		// Parse connectivity.txt for endpoint info
		if (filename.includes('connectivity.txt')) {
			const endpointMatch = content.match(/endpoint[:\s]+([^\s\n]+)/i);
			if (endpointMatch) info.endpoint = endpointMatch[1];
		}

		// Parse version.txt
		if (filename.includes('version.txt')) {
			info.warpVersion = content.trim();
		}

		// Parse sysinfo.json
		if (filename.includes('sysinfo.json')) {
			try {
				info.systemInfo = JSON.parse(content);
			} catch {
				// Ignore parse errors
			}
		}
	} catch (error) {
		info.parseError = error.message;
	}

	return info;
}
