export function sleep(ms: number) {
  if (ms === Infinity) return new Promise<never>(() => void 0);
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function waitWithTimeout<T>(
  p: Promise<T>,
  timeout: number,
  cancelFn?: () => unknown,
): Promise<T> {
  const timeoutSymbol = Symbol("timeout");
  const timeoutPromise = new Promise<typeof timeoutSymbol>((resolve) => {
    setTimeout(() => {
      resolve(timeoutSymbol);
    }, timeout);
  });
  const t = await Promise.race([p, timeoutPromise]);
  if (t === timeoutSymbol) {
    if (cancelFn) cancelFn();
    throw new Error("Timeout running function");
  }
  return t;
}
