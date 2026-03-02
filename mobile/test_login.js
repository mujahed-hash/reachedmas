const fetch = require('node-fetch');

async function test() {
  const baseUrl = "https://reachmasked.com";
  console.log("Fetching CSRF...");
  const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();
  const cookies = csrfRes.headers.raw()['set-cookie'];
  console.log("CSRF Token:", csrfToken);

  console.log("Posting Login...");
  const res = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: "POST",
      headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json",
          "Cookie": cookies ? cookies.join('; ') : ''
      },
      body: new URLSearchParams({
          csrfToken,
          email: "admin@reachmasked.com",
          password: "password",
          redirect: "false",
      }).toString(),
      redirect: "manual"
  });

  console.log("Status:", res.status);
  console.log("Headers:", res.headers.raw());
  const setCookie = res.headers.get("set-cookie") || "";
  console.log("Set-Cookie:", setCookie);
}
test().catch(console.error);
