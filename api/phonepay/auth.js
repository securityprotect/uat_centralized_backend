export async function getPhonePeAccessToken() {
  const res = await fetch(
    "https://api-preprod.phonepe.com/apis/identity-manager/v1/oauth/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.PHONEPE_CLIENT_ID,
        client_secret: process.env.PHONEPE_CLIENT_SECRET,
        client_version: process.env.PHONEPE_CLIENT_VERSION,
        grant_type: "client_credentials"
      })
    }
  );

  const data = await res.json();
  return data.access_token;
}
