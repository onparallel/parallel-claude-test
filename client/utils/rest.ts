export async function postJson<T = any>(url: string, content?: any) {
  const res = await fetch(url, {
    credentials: "include",
    method: "POST",
    body: content && JSON.stringify(content),
    headers: { "Content-Type": "application/json" },
  });
  if (res.status === 204) {
    return null;
  } else if (res.ok) {
    return (await res.json()) as T;
  } else {
    throw await res.json();
  }
}
