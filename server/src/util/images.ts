import fetch from "node-fetch";

const ALLOWED_EXTENSIONS = ["png", "jpeg", "jpg"];

export async function downloadImageBase64(url: string) {
  const extension = url.split(".").pop();
  if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
    throw new Error(
      `URL must end with an allowed extension. url: ${url}, allowed extensions: ${JSON.stringify(
        ALLOWED_EXTENSIONS
      )}`
    );
  }
  return await fetch(url)
    .then((r) => r.buffer())
    .then((buffer) => buffer.toString("base64"));
}
