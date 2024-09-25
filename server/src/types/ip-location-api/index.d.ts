declare module "ip-location-api" {
  export function lookup(ip: string): Promise<{ country: string }>;
}
