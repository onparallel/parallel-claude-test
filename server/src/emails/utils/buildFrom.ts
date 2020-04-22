export function buildFrom(name: string, email: string) {
  return `"${name.replace(/"/g, '\\"')}" <${email}>`;
}
