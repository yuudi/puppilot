import { Page } from "puppeteer-core";
import { JobResult, Store } from "../types.js";
import { TaskPool, waitWithTimeout } from "../utils/index.js";
import { Course } from "./course.js";

type SailStatus = "created" | "processing" | "completed";

export interface Sailer {
  getNewPage: () => Promise<Page>;
  getStore: (store: string) => Promise<Store>;
}

export class Sail {
  private status: SailStatus = "created";
  private total: number;
  private done: number;
  private taskPool: TaskPool;
  private results: (JobResult | { status: "processing" } | undefined)[];

  constructor(
    private courses: Course[],
    private config: Readonly<{
      maxParallelRoutine?: number;
    }>,
  ) {
    this.total = courses.length;
    this.results = Array(this.total);
    this.done = 0;
  }

  public async init() {
    const maxParallelRoutine = this.config.maxParallelRoutine || 1;
    this.taskPool = new TaskPool(maxParallelRoutine);
  }

  private async startRoutine(index: number, course: Course, sailer: Sailer) {
    this.results[index] = {
      status: "processing",
    };
    try {
      this.results[index] = await waitWithTimeout(
        course.startRoutine(sailer),
        course.meta.timeLimit,
      );
    } catch (error) {
      this.results[index] = {
        status: "error" as const,
        message: String(error?.message || error),
      };
    } finally {
      this.done += 1;
    }
  }

  public async start(sailer: Sailer) {
    this.status = "processing";
    await Promise.all(
      this.courses.map(async (course, i) => {
        await this.taskPool.run(() => this.startRoutine(i, course, sailer));
      }),
    );
    this.status = "completed";
    return this.results;
  }

  private getResults() {
    return this.results.map(
      (result) =>
        result ?? {
          status: "pending" as const,
        },
    );
  }

  public async getStatus() {
    return {
      status: this.status,
      total: this.total,
      done: this.done,
      results: this.getResults(),
    };
  }

  public async stop() {
    // not implemented
  }
}
