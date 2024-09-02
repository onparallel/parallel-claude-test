export async function downloadImageBase64(url: string) {
  const response = await fetch(url);
  return Buffer.from(await response.arrayBuffer()).toString("base64");
}
