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
    // Remove quotes
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
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seedUser(email, password, name, role, plan) {
  console.log(`Seeding user: ${email}...`);

  // 1. Check if user exists in auth.users
  const { data, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("Error listing users:", listError.message);
    return;
  }

  const users = data?.users || [];
  let user = users.find((u) => u.email === email);
  let userId;

  if (user) {
    console.log(`User ${email} already exists. Updating password...`);
    userId = user.id;
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (updateError) {
      console.error(`Error updating user ${email}:`, updateError.message);
      return;
    }
    console.log(`User ${email} updated successfully.`);
  } else {
    console.log(`User ${email} does not exist. Creating...`);
    const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (createError) {
      console.error(`Error creating user ${email}:`, createError.message);
      return;
    }
    userId = createdUser.user.id;
    console.log(`User ${email} created successfully with ID: ${userId}`);
  }

  // 2. Wait a brief moment and upsert the profile directly
  console.log(`Upserting profile for ${email}...`);
  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      email,
      name,
      role,
    },
    { onConflict: "id" }
  );

  if (profileError) {
    console.error(`Error upserting profile for ${email}:`, profileError.message);
  } else {
    console.log(`Profile for ${email} upserted successfully.`);
  }

  // 3. Upsert subscription
  console.log(`Upserting subscription for ${email}...`);
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const { error: subError } = await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      plan: plan,
      status: "active",
      monthly_usage: 0,
      usage_reset_at: nextMonth.toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (subError) {
    console.error(`Error upserting subscription for ${email}:`, subError.message);
  } else {
    console.log(`Subscription for ${email} upserted successfully.`);
  }

  console.log(`--- Finished seeding ${email} ---\n`);
}

async function run() {
  try {
    await seedUser("admin@procomm.ai", "Admin@123456!", "Admin", "admin", "admin");
    await seedUser("testuser@test.com", "Test@123456", "Test User", "user", "monthly");
    await seedUser("officialdeepparekh919@gmail.com", "Deep@123456", "Deep", "admin", "developer");
    console.log("Seeding process completed!");
  } catch (e) {
    console.error("Seeding failed:", e);
  }
}

run();
