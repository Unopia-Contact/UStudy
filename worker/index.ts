import { handleAnalyticsRequest } from './analytics';
import type { WorkerEnv } from './types';

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/analytics/installation') {
      return handleAnalyticsRequest(request, env);
    }
    if (url.pathname.startsWith('/api/analytics/')) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      });
    }
    return env.ASSETS.fetch(request);
  },
};

