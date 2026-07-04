const token = "sbp_c66686c472bcaba18653ba8250e7b719361dcc27"; // user's access token
const ref = "ikmgrwqfqxbjgofmdczk";

async function run() {
  console.log("Updating sender email address to noreply@procomm.ai...");

  try {
    const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        smtp_admin_email: "noreply@procomm.ai",
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Status: ${response.status}`);
    }

    console.log("✅ Successfully updated sender email to: noreply@procomm.ai");
  } catch (error) {
    console.error("❌ Failed to update sender email:", error.message);
  }
}

run();
