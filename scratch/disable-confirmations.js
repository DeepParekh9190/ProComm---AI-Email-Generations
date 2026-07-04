const token = "sbp_c66686c472bcaba18653ba8250e7b719361dcc27"; // user's access token
const ref = "ikmgrwqfqxbjgofmdczk";

async function run() {
  console.log("Setting mailer_autoconfirm = true to bypass email confirmation on your new Supabase project...");

  try {
    const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mailer_autoconfirm: true,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Status: ${response.status}`);
    }

    console.log("✅ Successfully enabled Auto-Confirm for emails!");
    console.log("Signups will now succeed instantly without trying to send confirmation emails.");
  } catch (error) {
    console.error("❌ Failed to update auth config:", error.message);
  }
}

run();
