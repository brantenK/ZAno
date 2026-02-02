
export type LimitFunction = <T>(fn: () => Promise<T>) => Promise<T>;

/**
 * Run multiple promise-returning & async functions with limited concurrency
 * @param concurrency - Concurrency limit (must be 1 or higher)
 */
export function pLimit(concurrency: number): LimitFunction {
  if (!((Number.isInteger(concurrency) || concurrency === Infinity) && concurrency > 0)) {
    throw new TypeError('Expected `concurrency` to be a number from 1 and up');
  }

  const queue: (() => void)[] = [];
  let activeCount = 0;

  const next = () => {
    activeCount--;
    if (queue.length > 0) {
      const nextJob = queue.shift();
      if (nextJob) {
        activeCount++;
        nextJob();
      }
    }
  };

  const generator = <T>(fn: () => Promise<T>): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const run = async () => {
        try {
          resolve(await fn());
        } catch (err) {
          reject(err);
        } finally {
          next();
        }
      };

      if (activeCount < concurrency) {
        activeCount++;
        run();
      } else {
        queue.push(run);
      }
    });
  };

  return generator;
}
