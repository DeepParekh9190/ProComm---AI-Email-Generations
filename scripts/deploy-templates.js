const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Helper to ask user for input in CLI
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}

// Read .env.local
const envPath = path.join(__dirname, "..", ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("❌ .env.local file not found. Please set it up first.");
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
if (!supabaseUrl) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL in .env.local");
  process.exit(1);
}

// Extract project ref (e.g. ctsreewlqosdmwkuhket from https://ctsreewlqosdmwkuhket.supabase.co)
const matchRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase/);
if (!matchRef) {
  console.error("❌ Could not parse project reference from NEXT_PUBLIC_SUPABASE_URL");
  process.exit(1);
}
const projectRef = matchRef[1];

async function run() {
  console.log(`🚀 Found Supabase Project Ref: ${projectRef}`);
  console.log("--------------------------------------------------");
  console.log("To deploy email templates, you need a Supabase Personal Access Token.");
  console.log("You can generate one here: https://supabase.com/dashboard/account/tokens");
  console.log("--------------------------------------------------");

  let token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    token = await askQuestion("🔑 Paste your Supabase Access Token: ");
    token = token.trim();
  }

  if (!token) {
    console.error("❌ Access token is required to deploy.");
    process.exit(1);
  }

  // Load template files
  const confirmPath = path.join(__dirname, "..", "supabase", "templates", "confirm.html");
  const resetPath = path.join(__dirname, "..", "supabase", "templates", "password-reset.html");

  if (!fs.existsSync(confirmPath) || !fs.existsSync(resetPath)) {
    console.error("❌ Custom HTML email template files not found under supabase/templates/");
    process.exit(1);
  }

  const confirmHtml = fs.readFileSync(confirmPath, "utf-8");
  const resetHtml = fs.readFileSync(resetPath, "utf-8");

  console.log("\n📦 Uploading custom email templates to remote project...");

  try {
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mailer_subjects_confirmation: "Confirm your ProComm account",
        mailer_templates_confirmation_content: confirmHtml,
        mailer_subjects_recovery: "Reset your ProComm password",
        mailer_templates_recovery_content: resetHtml,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! Status: ${response.status}`);
    }

    console.log("✅ Successfully deployed 'Confirm Email' template!");
    console.log("✅ Successfully deployed 'Reset Password' template!");
    console.log("\n🎉 Custom templates are now live on your remote Supabase project!");
  } catch (error) {
    console.error("\n❌ Failed to deploy templates:", error.message);
  }
}

run();
