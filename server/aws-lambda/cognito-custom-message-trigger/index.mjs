import { request } from "node:https";

export const handler = (event, context, callback) => {
  const req = request(
    `${process.env.PARALLEL_BASE_URL}/api/lambda/${event.triggerSource}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.AWS_LAMBDA_PARALLEL_SECRET}`,
      },
    },
    (res) => {
      if (res.statusCode < 200 || res.statusCode > 299) {
        return callback(new Error(`HTTP status code ${res.statusCode}`));
      }
      res.setEncoding("utf8");
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        event.response = JSON.parse(body);
        callback(null, event);
      });
    },
  );

  req.on("error", (e) => {
    callback(e);
  });
  req.on("timeout", () => {
    req.destroy(new Error("Request timed out"));
  });

  req.write(JSON.stringify(event.request));
  req.end();
};
