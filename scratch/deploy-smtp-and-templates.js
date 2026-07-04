const fs = require("fs");
const path = require("path");

// Read .env.local
const envPath = path.join(__dirname, "..", ".env.local");
if (!fs.existsSync(envPath)) {
  console.error(".env.local file not found.");
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
const resendKey = env.RESEND_API_KEY;
const token = "sbp_c66686c472bcaba18653ba8250e7b719361dcc27"; // user's access token

if (!supabaseUrl || !resendKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or RESEND_API_KEY in .env.local");
  process.exit(1);
}

const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase/)[1];

async function run() {
  console.log(`🚀 Project Ref: ${projectRef}`);

  // Load templates
  const confirmHtml = fs.readFileSync(path.join(__dirname, "..", "supabase", "templates", "confirm.html"), "utf-8");
  const resetHtml = fs.readFileSync(
    path.join(__dirname, "..", "supabase", "templates", "password-reset.html"),
    "utf-8"
  );

  console.log("Step 1: Enabling Custom SMTP using your Resend API Key...");

  try {
    const smtpResponse = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        smtp_host: "smtp.resend.com",
        smtp_port: "465",
        smtp_user: "resend",
        smtp_pass: resendKey,
        smtp_sender_name: "ProComm",
        smtp_admin_email: "onboarding@resend.dev", // Default Resend test domain sender
      }),
    });

    const smtpData = await smtpResponse.json();
    if (!smtpResponse.ok) {
      throw new Error(smtpData.message || `SMTP config failed with status ${smtpResponse.status}`);
    }
    console.log("✅ Custom SMTP successfully configured!");

    console.log("\nStep 2: Uploading custom email templates...");
    const templateResponse = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
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

    const templateData = await templateResponse.json();
    if (!templateResponse.ok) {
      throw new Error(templateData.message || `Template upload failed with status ${templateResponse.status}`);
    }

    console.log("✅ Confirm Email template uploaded successfully!");
    console.log("✅ Reset Password template uploaded successfully!");
    console.log("\n🎉 Setup completed! Custom SMTP is enabled and your templates are live!");
  } catch (error) {
    console.error("\n❌ Setup failed:", error.message);
  }
}

run();
