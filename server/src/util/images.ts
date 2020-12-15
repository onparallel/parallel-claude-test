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
  const response = await fetch(url);
  const buffer = await response.buffer();
  return buffer.toString("base64");
}
