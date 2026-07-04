const token = "sbp_c66686c472bcaba18653ba8250e7b719361dcc27"; // user's access token
const ref = "ikmgrwqfqxbjgofmdczk";
const newResendKey = "re_QwuNHn2t_AFxyFhBYXbpBv7i4uxXuT7yM";

async function run() {
  console.log("Updating your Supabase project SMTP password and re-enabling email confirmations...");

  try {
    const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        smtp_pass: newResendKey,
        mailer_autoconfirm: false,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Status: ${response.status}`);
    }

    console.log("✅ Successfully updated Resend SMTP password!");
    console.log("✅ Re-enabled email confirmation requirement (mailer_autoconfirm = false).");
  } catch (error) {
    console.error("❌ Failed to update project auth config:", error.message);
  }
}

run();
