/* eslint-disable @typescript-eslint/no-var-requires */

const https = require("https");

async function post(url, data) {
  const dataString = JSON.stringify(data);

  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": dataString.length,
        },
      },
      (res) => {
        if (res.statusCode < 200 || res.statusCode > 299) {
          return reject(new Error(`HTTP status code ${res.statusCode}`));
        }

        const body = [];
        res.on("data", (chunk) => body.push(chunk));
        res.on("end", () => {
          resolve(JSON.parse(Buffer.concat(body).toString()));
        });
      }
    );

    req.on("error", (err) => {
      reject(err);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request time out"));
    });

    req.write(dataString);
    req.end();
  });
}

exports.handler = async (event, context, callback) => {
  event.response = await post(
    `${process.env.PARALLEL_BASE_URL}/api/lambda/${event.triggerSource}`,
    event.request
  );

  callback(null, event);
};
