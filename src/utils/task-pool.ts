export class TaskPool {
  private runningTasks = 0;
  private taskQueue: (() => void)[] = [];

  constructor(private maxParallel: number) {}

  public async run<T>(task: () => Promise<T>): Promise<T> {
    if (this.runningTasks < this.maxParallel) {
      return this.executeTask(task);
    } else {
      return new Promise<T>((resolve, reject: (error: unknown) => void) => {
        this.taskQueue.push(() => {
          this.executeTask(task).then(resolve).catch(reject);
        });
      });
    }
  }

  private async executeTask<T>(task: () => Promise<T>): Promise<T> {
    this.runningTasks++;
    try {
      const result = await task();
      return result;
    } finally {
      this.runningTasks--;
      this.taskQueue.shift()();
    }
  }
}
