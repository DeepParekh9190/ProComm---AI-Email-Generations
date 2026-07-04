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

async function sync() {
  console.log("Starting profile & subscription sync...");

  // 1. Fetch all auth users
  const {
    data: { users },
    error: authError,
  } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error("Auth error:", authError.message);
    return;
  }
  console.log(`Found ${users.length} total users in auth.users.`);

  // 2. Fetch all existing profiles
  const { data: profiles, error: profError } = await supabase.from("profiles").select("id");
  if (profError) {
    console.error("Profiles fetch error:", profError.message);
    return;
  }
  const profileIds = new Set(profiles.map((p) => p.id));

  // 3. Sync missing profiles
  for (const user of users) {
    if (!profileIds.has(user.id)) {
      console.log(`User ${user.email} (ID: ${user.id}) is missing a profile. Syncing...`);

      const name = user.user_metadata?.name || user.email.split("@")[0];
      const role = "user"; // default role

      const { error: insertProfError } = await supabase.from("profiles").insert({
        id: user.id,
        email: user.email,
        name: name,
        role: role,
      });

      if (insertProfError) {
        console.error(`Error inserting profile for ${user.email}:`, insertProfError.message);
      } else {
        console.log(`Successfully created profile for ${user.email}.`);
      }
    } else {
      console.log(`User ${user.email} already has a profile.`);
    }

    // 4. Also check/sync subscription
    const { data: sub, error: subFetchError } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (subFetchError) {
      console.error(`Error checking subscription for ${user.email}:`, subFetchError.message);
    } else if (!sub) {
      console.log(`User ${user.email} is missing a subscription. Creating developer subscription...`);
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const { error: insertSubError } = await supabase.from("subscriptions").insert({
        user_id: user.id,
        plan: "developer",
        status: "active",
        monthly_usage: 0,
        usage_reset_at: nextMonth.toISOString(),
      });

      if (insertSubError) {
        console.error(`Error creating subscription for ${user.email}:`, insertSubError.message);
      } else {
        console.log(`Successfully created developer subscription for ${user.email}.`);
      }
    }
  }

  console.log("Sync process complete!");
}

sync();
