import fetch from "node-fetch";

export default async function handler(req: any, res: any) {
  try {
    const response = await fetch("http://localhost:4000/ping");
    if (!response.ok) {
      throw new Error();
    }
    res.status(200).send(process.env.BUILD_ID);
  } catch {
    res.status(418).send();
  }
}
