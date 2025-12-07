/**
 * Cloudflare WARP Diagnostics and PCAP Analyzer
 * Uses Workers AI (Llama 4 Scout) to analyze WARP diag logs and packet captures
 */

import { extractZipFiles, parseTextFile, parsePcapBasic, categorizeWarpFile, extractKeyInfo } from './parsers.js';
import { analyzeWarpDiagnostics, analyzePcapWithAI } from './ai-analyzer.js';
import { UI_HTML } from './ui.js';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Handle CORS preflight requests
 */
function handleOptions() {
  return new Response(null, {
    headers: corsHeaders,
  });
}

/**
 * Create error response
 */
function errorResponse(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Create success response
 */
function successResponse(data) {
  return new Response(JSON.stringify(data), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Process uploaded files and extract analysis data
 */
async function processUploadedFiles(formData) {
  const files = [];
  const pcapFiles = [];
  
  for (const [name, file] of formData.entries()) {
    if (file instanceof File) {
      files.push({
        name: file.name,
        data: await file.arrayBuffer(),
        type: file.type,
      });
    }
  }

  if (files.length === 0) {
    throw new Error('No files uploaded');
  }

  // Process each file
  const allLogFiles = [];
  const allPcapMetadata = [];

  for (const file of files) {
    // Check if it's a ZIP file
    if (file.name.endsWith('.zip') || file.type === 'application/zip') {
      const extractedFiles = extractZipFiles(file.data);
      
      for (const [filename, data] of extractedFiles) {
        const category = categorizeWarpFile(filename);
        
        if (filename.endsWith('.pcap')) {
          // Parse PCAP file
          const pcapMetadata = parsePcapBasic(data);
          allPcapMetadata.push({ filename, ...pcapMetadata });
        } else {
          // Parse text file
          try {
            const content = parseTextFile(data);
            const keyInfo = extractKeyInfo(filename, content);
            allLogFiles.push({
              filename,
              content,
              category: category.category,
              priority: category.priority,
              keyInfo,
            });
          } catch (error) {
            console.warn(`Failed to parse ${filename}:`, error);
          }
        }
      }
    } else if (file.name.endsWith('.pcap')) {
      // Individual PCAP file
      const pcapMetadata = parsePcapBasic(new Uint8Array(file.data));
      allPcapMetadata.push({ filename: file.name, ...pcapMetadata });
    } else {
      // Individual text file
      try {
        const data = new Uint8Array(file.data);
        const content = parseTextFile(data);
        const category = categorizeWarpFile(file.name);
        const keyInfo = extractKeyInfo(file.name, content);
        allLogFiles.push({
          filename: file.name,
          content,
          category: category.category,
          priority: category.priority,
          keyInfo,
        });
      } catch (error) {
        console.warn(`Failed to parse ${file.name}:`, error);
      }
    }
  }

  return { logFiles: allLogFiles, pcapMetadata: allPcapMetadata };
}

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }

    // Handle GET request - Web UI or API info
    if (request.method === 'GET') {
      const acceptHeader = request.headers.get('accept') || '';
      
      // Serve HTML UI for browser requests
      if (acceptHeader.includes('text/html')) {
        return new Response(UI_HTML, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/html; charset=utf-8',
          },
        });
      }
      
      // Serve JSON API info for programmatic requests
      return successResponse({
        name: 'WARP Diagnostics & PCAP Analyzer',
        version: '1.0.0',
        description: 'AI-powered analysis of Cloudflare WARP diagnostic logs and packet captures',
        model: 'Llama 4 Scout 17B',
        endpoints: {
          ui: 'GET / - Web interface (browser)',
          api_info: 'GET / - API info (Accept: application/json)',
          analyze: 'POST / - Upload warp-diag ZIP or PCAP files for analysis',
        },
        usage: 'Send multipart/form-data with file attachments',
      });
    }

    // Only accept POST for analysis
    if (request.method !== 'POST') {
      return errorResponse('Method not allowed. Use POST to upload files.', 405);
    }

    // Check if AI binding is available
    if (!env.AI) {
      return errorResponse('AI binding not configured. Please check wrangler.jsonc', 500);
    }

    try {
      // Parse multipart form data
      const contentType = request.headers.get('content-type') || '';
      if (!contentType.includes('multipart/form-data')) {
        return errorResponse('Content-Type must be multipart/form-data');
      }

      const formData = await request.formData();
      
      // Process uploaded files
      const { logFiles, pcapMetadata } = await processUploadedFiles(formData);

      if (logFiles.length === 0 && pcapMetadata.length === 0) {
        return errorResponse('No valid WARP diag or PCAP files found in upload');
      }

      // Prioritize high-priority files for AI analysis (to stay within token limits)
      const priorityFiles = logFiles
        .filter(f => f.priority === 'high')
        .slice(0, 10); // Limit to top 10 files

      const mediumFiles = logFiles
        .filter(f => f.priority === 'medium')
        .slice(0, 5); // Add some medium priority files

      const filesToAnalyze = [...priorityFiles, ...mediumFiles];

      console.log(`Analyzing ${filesToAnalyze.length} log files and ${pcapMetadata.length} PCAP files`);

      // Run AI analysis
      const analysis = await analyzeWarpDiagnostics(
        env.AI,
        filesToAnalyze,
        pcapMetadata.length > 0 ? pcapMetadata[0] : null
      );

      // Compile results
      const results = {
        timestamp: new Date().toISOString(),
        filesProcessed: {
          logFiles: logFiles.length,
          pcapFiles: pcapMetadata.length,
          total: logFiles.length + pcapMetadata.length,
        },
        filesAnalyzed: filesToAnalyze.length,
        pcapMetadata: pcapMetadata,
        analysis: analysis.analysis || analysis.fallback,
        modelUsed: analysis.model,
        success: analysis.success,
      };

      // Add error info if AI analysis failed
      if (!analysis.success) {
        results.warning = 'AI analysis failed, using fallback rule-based analysis';
        results.error = analysis.error;
      }

      return successResponse(results);

    } catch (error) {
      console.error('Analysis error:', error);
      return errorResponse(
        `Analysis failed: ${error.message}`,
        500
      );
    }
  },
};