const https = require("https");

const url = "https://www.google.com";

https
  .get(url, (res) => {
    console.log("Status Code:", res.statusCode);
    console.log("Headers:", res.headers);
  })
  .on("error", (e) => {
    console.error("Error connecting:", e.message);
  });
