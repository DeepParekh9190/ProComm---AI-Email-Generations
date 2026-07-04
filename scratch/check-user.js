const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// Read .env.local
const envPath = path.join(__dirname, "..", ".env.local");
if (!fs.existsSync(envPath)) {
  console.error(".env.local file not found at " + envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || "";
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value.trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function check() {
  console.log("Checking Supabase project:", supabaseUrl);

  // 1. Check in auth.users
  const {
    data: { users },
    error: authError,
  } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error("Auth error:", authError.message);
  } else {
    console.log(`Found ${users.length} users in auth.users.`);
    const matched = users.filter((u) => u.email.toLowerCase().includes("aalor"));
    console.log("Matched auth users:", JSON.stringify(matched, null, 2));
  }

  // 2. Check in public.profiles
  const { data: profiles, error: profError } = await supabase.from("profiles").select("*");
  if (profError) {
    console.error("Profiles error:", profError.message);
  } else {
    console.log(`Found ${profiles.length} profiles in public.profiles.`);
    const matchedProf = profiles.filter((p) => p.email && p.email.toLowerCase().includes("aalor"));
    console.log("Matched public profiles:", JSON.stringify(matchedProf, null, 2));
  }
}

check();
