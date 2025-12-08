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
 * Parse PCAP/PCAPNG file and extract basic metadata
 * Note: Full PCAP parsing requires binary analysis. This provides basic info.
 * Supports both PCAP (legacy) and PCAPNG (next generation) formats.
 * @param {Uint8Array} data - PCAP/PCAPNG file data
 * @returns {Object} - Basic PCAP metadata
 */
export function parsePcapBasic(data) {
	if (data.length < 24) {
		return { error: 'Invalid PCAP file: too small' };
	}

	const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
	const magicNumber = view.getUint32(0, true);
	
	// Check for PCAP magic numbers
	const isPcap = magicNumber === 0xa1b2c3d4 || magicNumber === 0xd4c3b2a1;
	const isPcapNg = magicNumber === 0x0a0d0d0a;
	
	if (!isPcap && !isPcapNg) {
		return { error: 'Invalid PCAP file: unrecognized magic number' };
	}

	if (isPcapNg) {
		// PCAPNG format - count blocks properly
		let packetCount = 0;
		let offset = 0;
		
		while (offset + 8 <= data.length) {
			try {
				const blockType = view.getUint32(offset, true);
				const blockLength = view.getUint32(offset + 4, true);
				
				if (blockLength < 12 || offset + blockLength > data.length) break;
				
				// Enhanced Packet Block (EPB) = 0x00000006
				// Simple Packet Block (SPB) = 0x00000003
				// Packet Block (obsolete) = 0x00000002
				if (blockType === 0x00000006 || blockType === 0x00000003 || blockType === 0x00000002) {
					packetCount++;
				}
				
				offset += blockLength;
			} catch {
				break;
			}
		}
		
		return {
			format: 'PCAPNG',
			version: 'NG',
			snaplen: 65535, // Default for PCAPNG
			network: 1, // Ethernet assumed
			packetCount,
			fileSize: data.length,
		};
	}

	// PCAP format
	const isLittleEndian = magicNumber === 0xa1b2c3d4;
	const versionMajor = view.getUint16(4, isLittleEndian);
	const versionMinor = view.getUint16(6, isLittleEndian);
	const snaplen = view.getUint32(16, isLittleEndian);
	const network = view.getUint32(20, isLittleEndian);

	// Count packets in PCAP format
	let packetCount = 0;
	let offset = 24;
	while (offset + 16 <= data.length) {
		try {
			const capturedLength = view.getUint32(offset + 8, isLittleEndian);
			if (capturedLength > 65535 || offset + 16 + capturedLength > data.length) break;
			packetCount++;
			offset += 16 + capturedLength;
		} catch {
			break;
		}
	}

	return {
		format: 'PCAP',
		version: `${versionMajor}.${versionMinor}`,
		snaplen,
		network,
		packetCount,
		fileSize: data.length,
	};
}

/**
 * Extract detailed packet summaries from PCAP/PCAPNG as text entries
 * @param {Uint8Array} data - PCAP/PCAPNG file data
 * @param {string} filename - Original filename
 * @returns {string} - Text summary of packets for analysis
 */
export function extractPcapPacketSummaries(data, filename) {
	const metadata = parsePcapBasic(data);
	
	if (metadata.error) {
		return `PCAP file: ${filename}\nError: ${metadata.error}`;
	}

	const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
	const magicNumber = view.getUint32(0, true);
	const isPcapNg = magicNumber === 0x0a0d0d0a;
	
	let summaryLines = [];
	summaryLines.push(`${metadata.format} file: ${filename}`);
	summaryLines.push(`Format: ${metadata.format} v${metadata.version}`);
	summaryLines.push(`Total Packets: ${metadata.packetCount}`);
	summaryLines.push(`File Size: ${metadata.fileSize} bytes`);
	summaryLines.push(`\n=== PACKET ANALYSIS (first 50 packets) ===\n`);
	
	const maxPackets = Math.min(50, metadata.packetCount); // Analyze up to 50 packets
	let packetNum = 0;
	
	if (isPcapNg) {
		// Parse PCAPNG format
		let offset = 0;
		
		while (offset + 8 <= data.length && packetNum < maxPackets) {
			try {
				const blockType = view.getUint32(offset, true);
				const blockLength = view.getUint32(offset + 4, true);
				
				if (blockLength < 12 || offset + blockLength > data.length) break;
				
				// Enhanced Packet Block (0x00000006) - most common
				if (blockType === 0x00000006 && blockLength >= 32) {
					const tsHigh = view.getUint32(offset + 12, true);
					const tsLow = view.getUint32(offset + 16, true);
					const capturedLen = view.getUint32(offset + 20, true);
					const originalLen = view.getUint32(offset + 24, true);
					
					// Timestamp is in microseconds
					const timestamp = new Date((tsHigh * 4294967296 + tsLow) / 1000);
					const timeStr = timestamp.toISOString();
					
					summaryLines.push(`[Packet ${packetNum + 1}] ${timeStr}`);
					summaryLines.push(`  Size: ${capturedLen}/${originalLen} bytes`);
					
					// Parse packet data
					if (capturedLen >= 14 && offset + 28 + capturedLen <= data.length) {
						const packetData = data.slice(offset + 28, offset + 28 + capturedLen);
						const packetInfo = analyzePacketData(packetData, view, offset + 28);
						summaryLines.push(...packetInfo);
					}
					
					packetNum++;
				}
				
				offset += blockLength;
			} catch (e) {
				summaryLines.push(`  [Error parsing block at offset ${offset}]`);
				break;
			}
		}
	} else {
		// Parse PCAP format
		const isLittleEndian = magicNumber === 0xa1b2c3d4;
		let offset = 24; // Skip global header
		
		while (offset + 16 <= data.length && packetNum < maxPackets) {
			try {
				const tsSec = view.getUint32(offset, isLittleEndian);
				const tsUsec = view.getUint32(offset + 4, isLittleEndian);
				const capturedLength = view.getUint32(offset + 8, isLittleEndian);
				const originalLength = view.getUint32(offset + 12, isLittleEndian);
				
				if (capturedLength > 65535 || offset + 16 + capturedLength > data.length) break;
				
				const timestamp = new Date(tsSec * 1000 + tsUsec / 1000);
				const timeStr = timestamp.toISOString();
				
				summaryLines.push(`[Packet ${packetNum + 1}] ${timeStr}`);
				summaryLines.push(`  Size: ${capturedLength}/${originalLength} bytes`);
				
				if (capturedLength >= 14) {
					const packetInfo = analyzePacketData(data, view, offset + 16, capturedLength);
					summaryLines.push(...packetInfo);
				}
				
				packetNum++;
				offset += 16 + capturedLength;
			} catch (e) {
				summaryLines.push(`  [Error parsing packet ${packetNum + 1}]`);
				break;
			}
		}
	}
	
	if (metadata.packetCount > maxPackets) {
		summaryLines.push(`\n... and ${metadata.packetCount - maxPackets} more packets not shown`);
		summaryLines.push(`Total packet analysis coverage: ${Math.round(maxPackets/metadata.packetCount*100)}%`);
	}
	
	return summaryLines.join('\n');
}

/**
 * Analyze packet data and extract protocol information
 * @param {Uint8Array} data - Full data buffer
 * @param {DataView} view - DataView of the buffer  
 * @param {number} offset - Offset to packet start
 * @param {number} maxLen - Maximum length (optional)
 * @returns {Array<string>} - Array of info strings
 */
function analyzePacketData(data, view, offset, maxLen) {
	const info = [];
	const packetLen = maxLen || (data.length - offset);
	
	if (packetLen < 14) return ['  [Packet too small]'];
	
	try {
		// Ethernet header
		const etherType = view.getUint16(offset + 12, false);
		
		if (etherType === 0x0800 && packetLen >= 34) {
			// IPv4
			const ipHeaderLen = (data[offset + 14] & 0x0f) * 4;
			const ipProtocol = data[offset + 23];
			const srcIP = Array.from(data.slice(offset + 26, offset + 30)).join('.');
			const dstIP = Array.from(data.slice(offset + 30, offset + 34)).join('.');
			const ttl = data[offset + 22];
			
			let protocolName = 'IPv4';
			let details = '';
			
			if (ipProtocol === 6 && packetLen >= 34 + ipHeaderLen + 4) {
				// TCP
				const tcpOffset = offset + 14 + ipHeaderLen;
				const srcPort = view.getUint16(tcpOffset, false);
				const dstPort = view.getUint16(tcpOffset + 2, false);
				const flags = data[tcpOffset + 13];
				const flagStr = [];
				if (flags & 0x02) flagStr.push('SYN');
				if (flags & 0x10) flagStr.push('ACK');
				if (flags & 0x01) flagStr.push('FIN');
				if (flags & 0x04) flagStr.push('RST');
				if (flags & 0x08) flagStr.push('PSH');
				
				protocolName = 'TCP';
				details = ` | Port ${srcPort} → ${dstPort} [${flagStr.join(',')}]`;
				
				// Detect common protocols by port
				if (dstPort === 80 || srcPort === 80) details += ' (HTTP)';
				else if (dstPort === 443 || srcPort === 443) details += ' (HTTPS)';
				else if (dstPort === 22 || srcPort === 22) details += ' (SSH)';
				else if (dstPort === 53 || srcPort === 53) details += ' (DNS over TCP)';
			} else if (ipProtocol === 17 && packetLen >= 34 + ipHeaderLen + 4) {
				// UDP
				const udpOffset = offset + 14 + ipHeaderLen;
				const srcPort = view.getUint16(udpOffset, false);
				const dstPort = view.getUint16(udpOffset + 2, false);
				
				protocolName = 'UDP';
				details = ` | Port ${srcPort} → ${dstPort}`;
				
				// Detect common protocols
				if (dstPort === 53 || srcPort === 53) details += ' (DNS)';
				else if (dstPort === 67 || dstPort === 68) details += ' (DHCP)';
				else if (dstPort === 123) details += ' (NTP)';
				else if (dstPort === 500) details += ' (IKE/IPsec)';
			} else if (ipProtocol === 1) {
				// ICMP
				if (packetLen >= 34 + ipHeaderLen + 2) {
					const icmpType = data[offset + 34];
					const icmpCode = data[offset + 35];
					let icmpMsg = '';
					if (icmpType === 0) icmpMsg = 'Echo Reply (Ping response)';
					else if (icmpType === 8) icmpMsg = 'Echo Request (Ping)';
					else if (icmpType === 3) icmpMsg = `Destination Unreachable (code ${icmpCode})`;
					else if (icmpType === 11) icmpMsg = 'Time Exceeded';
					else icmpMsg = `Type ${icmpType} Code ${icmpCode}`;
					
					protocolName = 'ICMP';
					details = ` | ${icmpMsg}`;
				}
			}
			
			info.push(`  ${protocolName}: ${srcIP} → ${dstIP}${details}`);
			if (ttl < 10) info.push(`  ⚠️  Low TTL: ${ttl}`);
			
		} else if (etherType === 0x0806 && packetLen >= 28) {
			// ARP
			const opcode = view.getUint16(offset + 20, false);
			const senderIP = Array.from(data.slice(offset + 28, offset + 32)).join('.');
			const targetIP = Array.from(data.slice(offset + 38, offset + 42)).join('.');
			const operation = opcode === 1 ? 'Request' : opcode === 2 ? 'Reply' : 'Unknown';
			info.push(`  ARP ${operation}: Who has ${targetIP}? Tell ${senderIP}`);
			
		} else if (etherType === 0x86DD && packetLen >= 54) {
			// IPv6
			const nextHeader = data[offset + 20];
			const srcIP = Array.from(data.slice(offset + 22, offset + 38))
				.map((b, i) => i % 2 === 0 ? b.toString(16).padStart(2, '0') : b.toString(16).padStart(2, '0'))
				.join('')
				.match(/.{1,4}/g)
				.join(':');
			const dstIP = Array.from(data.slice(offset + 38, offset + 54))
				.map((b, i) => i % 2 === 0 ? b.toString(16).padStart(2, '0') : b.toString(16).padStart(2, '0'))
				.join('')
				.match(/.{1,4}/g)
				.join(':');
			
			let protocol = 'IPv6';
			if (nextHeader === 6) protocol = 'TCP over IPv6';
			else if (nextHeader === 17) protocol = 'UDP over IPv6';
			else if (nextHeader === 58) protocol = 'ICMPv6';
			
			info.push(`  ${protocol}: ${srcIP} → ${dstIP}`);
			
		} else {
			info.push(`  EtherType: 0x${etherType.toString(16).padStart(4, '0')}`);
		}
		
	} catch (e) {
		info.push(`  [Parse error: ${e.message}]`);
	}
	
	return info;
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
		pcap: ['.pcap', '.pcapng', '.qlog'],
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
