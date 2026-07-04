const token = "sbp_c66686c472bcaba18653ba8250e7b719361dcc27";
const ref = "ikmgrwqfqxbjgofmdczk";

async function run() {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
run();
