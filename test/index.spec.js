import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src';

describe('WARP Diagnostics Analyzer', () => {
	it('responds with API info on GET request', async () => {
		const request = new Request('http://example.com', { method: 'GET' });
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		
		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data.name).toBe('WARP Diagnostics & PCAP Analyzer');
		expect(data.model).toBe('Llama 4 Scout 17B');
	});

	it('handles OPTIONS request (CORS preflight)', async () => {
		const request = new Request('http://example.com', { method: 'OPTIONS' });
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		
		expect(response.status).toBe(200);
		expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
		expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
	});

	it('rejects non-multipart POST requests', async () => {
		const request = new Request('http://example.com', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ test: 'data' }),
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		
		expect(response.status).toBe(400);
		const data = await response.json();
		expect(data.error).toContain('multipart/form-data');
	});

	it('returns error when AI binding is missing', async () => {
		const formData = new FormData();
		const testFile = new File(['test content'], 'test.log', { type: 'text/plain' });
		formData.append('file', testFile);

		const request = new Request('http://example.com', {
			method: 'POST',
			body: formData,
		});

		// Test with env that doesn't have AI binding
		const envWithoutAI = {};
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, envWithoutAI, ctx);
		await waitOnExecutionContext(ctx);
		
		expect(response.status).toBe(500);
		const data = await response.json();
		expect(data.error).toContain('AI binding not configured');
	});

	it('integration: GET request returns API info', async () => {
		const response = await SELF.fetch('http://example.com');
		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data.version).toBe('1.0.0');
	});
});
