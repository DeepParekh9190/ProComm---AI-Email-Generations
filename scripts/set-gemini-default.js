const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.\-_]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let val = match[2] || '';
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    } else if (val.startsWith("'") && val.endsWith("'")) {
      val = val.substring(1, val.length - 1);
    }
    envVars[key] = val.trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Supabase config not found in env!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log("Setting Gemini 2.0 Flash (Free) as the default model...");

  // 1. Reset all models is_default to false
  const { error: resetError } = await supabase
    .from('ai_models')
    .update({ is_default: false })
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (resetError) {
    console.error("Failed to reset models:", resetError);
    process.exit(1);
  }

  // 2. Upsert Gemini 2.0 Flash (Free) as active and default
  const { data, error: upsertError } = await supabase
    .from('ai_models')
    .upsert({
      name: 'Gemini 2.0 Flash (Free)',
      model_id: 'google/gemini-2.0-flash-exp:free',
      is_active: true,
      is_default: true,
      sort_order: 1
    }, {
      onConflict: 'model_id'
    })
    .select();

  if (upsertError) {
    console.log("Upsert failed, trying direct select/update/insert...");
    const { data: existing } = await supabase
      .from('ai_models')
      .select('id')
      .eq('model_id', 'google/gemini-2.0-flash-exp:free')
      .maybeSingle();

    if (existing) {
      const { error: updateError } = await supabase
        .from('ai_models')
        .update({ is_active: true, is_default: true })
        .eq('id', existing.id);
      if (updateError) {
        console.error("Update failed:", updateError);
      } else {
        console.log("Successfully set existing Gemini model to default!");
      }
    } else {
      const { error: insertError } = await supabase
        .from('ai_models')
        .insert({
          name: 'Gemini 2.0 Flash (Free)',
          model_id: 'google/gemini-2.0-flash-exp:free',
          is_active: true,
          is_default: true,
          sort_order: 1
        });
      if (insertError) {
        console.error("Insert failed:", insertError);
      } else {
        console.log("Successfully inserted and set Gemini model to default!");
      }
    }
  } else {
    console.log("Successfully set Gemini 2.0 Flash (Free) as default model!", data);
  }
}

run();
