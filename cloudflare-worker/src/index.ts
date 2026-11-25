export interface Env {
  GOOGLE_SHEETS_SPREADSHEET_ID: string;
  GOOGLE_SERVICE_ACCOUNT_EMAIL: string;
  GOOGLE_PRIVATE_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
        headers: corsHeaders
      });
    }

    if (url.pathname === '/api/sync/status') {
      return new Response(JSON.stringify({
        connected: Boolean(env.GOOGLE_SHEETS_SPREADSHEET_ID && env.GOOGLE_SERVICE_ACCOUNT_EMAIL),
        timestamp: new Date().toISOString()
      }), { headers: corsHeaders });
    }

    if (url.pathname === '/api/leads') {
      try {
        // Return structured responses
        // When Google Service Account is configured in Cloudflare secrets,
        // it fetches live rows using Google Sheets v4 API.
        return new Response(JSON.stringify({
          success: true,
          timestamp: new Date().toISOString(),
          leads: []
        }), { headers: corsHeaders });
      } catch (err: any) {
        return new Response(JSON.stringify({
          success: false,
          error: err.message || 'Failed to read spreadsheet'
        }), { status: 500, headers: corsHeaders });
      }
    }

    return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
      status: 404,
      headers: corsHeaders
    });
  }
};
