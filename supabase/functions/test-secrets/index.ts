import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// List of secrets to check
const secrets = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_URL',
  'AIRTABLE_BASE_ID',
  'AIRTABLE_TOKEN',
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const secretsStatus: { [key: string]: boolean } = {};

    console.log("Checking for environment secrets...");

    secrets.forEach(secretName => {
      const secretValue = Deno.env.get(secretName);
      if (secretValue) {
        secretsStatus[secretName] = true;
      } else {
        secretsStatus[secretName] = false;
        console.log(`Missing secret: ${secretName}`);
      }
    });

    return new Response(
      JSON.stringify(secretsStatus, null, 2),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
}); 