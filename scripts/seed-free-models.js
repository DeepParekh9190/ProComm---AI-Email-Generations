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

const FREE_MODELS = [
  { name: 'Auto-Select Free (Recommended)', model_id: 'openrouter/free', sort_order: 1 },
  { name: 'Gemini 2.0 Flash (Free)', model_id: 'google/gemini-2.0-flash-exp:free', sort_order: 2 },
  { name: 'Gemini 2.0 Flash Thinking (Free)', model_id: 'google/gemini-2.0-flash-thinking-exp:free', sort_order: 3 },
  { name: 'DeepSeek V3 (Free)', model_id: 'deepseek/deepseek-chat:free', sort_order: 4 },
  { name: 'DeepSeek R1 (Free)', model_id: 'deepseek/deepseek-r1:free', sort_order: 5 },
  { name: 'Llama 3.3 70B (Free)', model_id: 'meta-llama/llama-3.3-70b-instruct:free', sort_order: 6 },
  { name: 'Qwen 2.5 72B (Free)', model_id: 'qwen/qwen-2.5-72b-instruct:free', sort_order: 7 },
  { name: 'Microsoft Phi-4 (Free)', model_id: 'microsoft/phi-4:free', sort_order: 8 },
  { name: 'Mistral Small 24B (Free)', model_id: 'mistralai/mistral-small-3.2-24b-instruct:free', sort_order: 9 }
];

async function run() {
  console.log("Upserting top free AI models into database...");

  // Delete deprecated or broken test entries (e.g. gemma-4 or qwen3-coder)
  await supabase
    .from('ai_models')
    .delete()
    .in('model_id', ['google/gemma-4-31b-it:free', 'qwen/qwen3-coder:free']);

  for (const model of FREE_MODELS) {
    const { data, error } = await supabase
      .from('ai_models')
      .upsert({
        name: model.name,
        model_id: model.model_id,
        is_active: true,
        is_default: model.model_id === 'google/gemini-2.0-flash-exp:free', // Set Gemini as default
        sort_order: model.sort_order
      }, {
        onConflict: 'model_id'
      })
      .select();

    if (error) {
      console.log(`Failed to upsert ${model.name}:`, error.message);
      // Fallback: try manual insert/update
      const { data: existing } = await supabase
        .from('ai_models')
        .select('id')
        .eq('model_id', model.model_id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('ai_models')
          .update({ name: model.name, sort_order: model.sort_order })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('ai_models')
          .insert({
            name: model.name,
            model_id: model.model_id,
            is_active: true,
            is_default: model.model_id === 'google/gemini-2.0-flash-exp:free',
            sort_order: model.sort_order
          });
      }
    } else {
      console.log(`Successfully upserted: ${model.name}`);
    }
  }

  console.log("Done!");
}

run();
