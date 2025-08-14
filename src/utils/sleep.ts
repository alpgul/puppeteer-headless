const DEFAULT_SLEEP_TIME = 1000;

/**
 *
 * @param ms
 */
export async function sleep(ms = DEFAULT_SLEEP_TIME): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
