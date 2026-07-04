const REQUIRED_PUBLIC_ENV_VARS = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];

const REQUIRED_SERVER_ENV_VARS = ["SUPABASE_SERVICE_ROLE_KEY"];

export function validateEnv() {
  const missing = [];

  for (const key of REQUIRED_PUBLIC_ENV_VARS) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error(
      `Missing required environment variables: ${missing.join(", ")}\n` +
        "Ensure these are set in .env.local or your hosting platform."
    );
    return false;
  }

  return true;
}

export function validateServerEnv() {
  const allRequired = [...REQUIRED_PUBLIC_ENV_VARS, ...REQUIRED_SERVER_ENV_VARS];
  const missing = [];

  for (const key of allRequired) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  return missing;
}
