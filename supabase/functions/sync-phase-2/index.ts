import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Define types for better code clarity and safety
interface AirtableRecord {
  id: string;
  createdTime: string;
  fields: {
    'first name'?: string;
    'last name'?: string;
    'phone number'?: string;
    'email address'?: string;
    'time requested for the interview'?: string;
    'interview summary'?: string;
  };
}

interface AirtableResponse {
  records: AirtableRecord[];
  offset?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

// Helper function to fetch all records from Airtable with pagination
async function getAllAirtableRecords(baseId: string, tableName: string, token: string) {
  let allRecords: AirtableRecord[] = []
  let offset: string | undefined

  do {
    const url = new URL(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`)
    if (offset) {
      url.searchParams.append('offset', offset)
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Airtable API error: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`)
    }

    const data: AirtableResponse = await response.json()
    allRecords = allRecords.concat(data.records)
    offset = data.offset
  } while (offset)

  return allRecords
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Get environment variables and fail early if they are missing
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const airtableToken = Deno.env.get('AIRTABLE_TOKEN')
    const airtableBaseId = Deno.env.get('AIRTABLE_BASE_ID')
    const airtableTable = "Phase 2, Table 2"

    if (!supabaseUrl || !supabaseServiceRoleKey || !airtableToken || !airtableBaseId) {
      throw new Error('Missing required environment variables.')
    }

    // 2. Initialize Supabase client
    const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey)

    // 3. Fetch all records from Airtable, handling pagination
    const airtableRecords = await getAllAirtableRecords(airtableBaseId, airtableTable, airtableToken)

    if (airtableRecords.length === 0) {
      return new Response(
        JSON.stringify({ success: true, synced: 0, message: "No records to sync." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // 4. Transform Airtable records into Supabase format
    const supabaseRecords = airtableRecords.map((record) => {
        const fields = record.fields
        return {
          airtable_id: record.id,
          first_name: fields['first name'] || null,
          last_name: fields['last name'] || null,
          phone_number: fields['phone number'] || null,
          email_address: fields['email address'] || null,
          time_requested_for_interview: fields['time requested for the interview'] || null,
          interview_summary: fields['interview summary'] || null,
        }
    })

    // 5. Batch upsert records into Supabase
    const { error } = await supabaseClient
      .from('phase_2_table_2')
      .upsert(supabaseRecords, { onConflict: 'airtable_id' })

    if (error) {
        console.error('Error upserting records:', error)
        throw new Error(`Supabase upsert error: ${error.message}`)
    }

    // 6. Return success response
    return new Response(
      JSON.stringify({
        success: true,
        synced: airtableRecords.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error(error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
