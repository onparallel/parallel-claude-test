import fetch from "node-fetch";

export async function downloadImageBase64(url: string) {
  const response = await fetch(url);
  const buffer = await response.buffer();
  return buffer.toString("base64");
}
