export default async function () {
  await (globalThis as any).shutdownContainers?.();
}
