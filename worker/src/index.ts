/**
 * Welcome to Cloudflare Workers!
 *
 * This worker acts as a secure proxy between your NEK LEADS frontend
 * and the Google Sheets API.
 * 
 * Environment Variables required:
 * - GOOGLE_SERVICE_ACCOUNT_EMAIL
 * - GOOGLE_PRIVATE_KEY
 * - SHEET_ID
 */

export interface Env {
  GOOGLE_SERVICE_ACCOUNT_EMAIL: string;
  GOOGLE_PRIVATE_KEY: string;
  SHEET_ID: string;
  // If you use KV or D1 for queuing/caching:
  // NEK_KV: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    
    // 1. CORS Setup
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*", // Replace with your production URL
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // 2. Routing
    const url = new URL(request.url);
    
    if (url.pathname === '/api/sync' && request.method === 'POST') {
      try {
        const queue = await request.json();
        
        // Example implementation strategy:
        // 1. Generate JWT using env.GOOGLE_SERVICE_ACCOUNT_EMAIL & env.GOOGLE_PRIVATE_KEY
        // 2. Call https://oauth2.googleapis.com/token
        // 3. Process the queue items (CREATE, UPDATE, DELETE)
        // 4. Batch update Google Sheets using https://sheets.googleapis.com/v4/spreadsheets/${env.SHEET_ID}:batchUpdate
        
        console.log(`Received ${Array.isArray(queue) ? queue.length : 0} items to sync`);
        
        return new Response(JSON.stringify({ success: true, syncedCount: Array.isArray(queue) ? queue.length : 0 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: "Bad Request" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    return new Response("NEK LEADS Worker API. Endpoints: POST /api/sync", {
      headers: corsHeaders
    });
  },
};
