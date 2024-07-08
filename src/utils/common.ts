export function sleep(ms: number) {
  if (ms === Infinity) return new Promise<never>(() => {});
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function waitWithTimeout<T>(
  p: Promise<T>,
  timeout: number,
  cancelFn?: () => unknown,
): Promise<T> {
  const timeoutSymbol = Symbol("timeout");
  const timeoutPromise = new Promise<T>((_, reject) => {
    setTimeout(() => {
      reject(timeoutSymbol);
    }, timeout);
  });
  try {
    const t = await Promise.race([p, timeoutPromise]);
    return t;
  } catch (error: symbol | unknown) {
    if (error === timeoutSymbol) {
      if (cancelFn) cancelFn();
      throw new Error("Timeout running function");
    }
    throw error;
  }
}
