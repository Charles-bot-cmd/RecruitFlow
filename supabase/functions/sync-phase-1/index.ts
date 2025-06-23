import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Define types for better code clarity and safety
interface AirtableRecord {
  id: string;
  createdTime: string;
  fields: {
    'Full Name'?: string;
    'Email Address'?: string;
    'LinkedIn Profile'?: string;
    'Role'?: string;
    'Experience'?: string;
    'Location Preference'?: string;
    'Cover Letter'?: string;
    'Technical Skills'?: string[];
    'Challenging Technical Project'?: string;
    'Status'?: string;
  };
}

interface AirtableResponse {
  records: AirtableRecord[];
  offset?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const airtableBaseId = 'apptHDacZ3rtgaFur' // As specified in the requirements

    if (!supabaseUrl || !supabaseServiceRoleKey || !airtableToken || !airtableBaseId) {
      throw new Error('Missing required environment variables.')
    }

    // 2. Initialize Supabase client
    const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey)

    // 3. Fetch all records from Airtable, handling pagination
    const airtableRecords = await getAllAirtableRecords(airtableBaseId, "Phase 1, Table 1", airtableToken)

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
        airtable_record_id: record.id,
        full_name: fields['Full Name'] || '',
        email_address: fields['Email Address'] || '',
        linkedin_profile: fields['LinkedIn Profile'] || null,
        role: fields['Role'] || null,
        experience: fields['Experience'] || null,
        location_preference: fields['Location Preference'] || null,
        cover_letter: fields['Cover Letter'] || null,
        technical_skills: fields['Technical Skills'] || null,
        challenging_technical_project: fields['Challenging Technical Project'] || null,
        status: fields['Status'] || 'pending',
        updated_at: new Date().toISOString()
      }
    })

    // 5. Batch upsert records into Supabase
    const { error } = await supabaseClient
      .from('phase_1_table_1')
      .upsert(supabaseRecords, {
        onConflict: 'airtable_record_id',
        ignoreDuplicates: false
      })

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
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
