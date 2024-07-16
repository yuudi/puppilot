import { Page } from "puppeteer-core";
import { JobResult, JobStatus, Promisable, SailStatus, Store } from "../types";
import { TaskPool, waitWithTimeout } from "../utils/index";
import { Course } from "./course";

export interface Sailer {
  getNewPage: () => Promisable<Page>;
  getStore: (store: string) => Promisable<Store>;
}

export class Sail {
  private status: SailStatus = "created";
  private total!: number;
  private done!: number;
  private taskPool!: TaskPool;
  private results!: (JobResult | { status: "processing" } | undefined)[];
  private courses!: Course[];

  public static create(
    courses: Course[],
    config: Readonly<{
      maxParallelRoutine?: number;
    }>,
  ) {
    const sail = new Sail();
    sail.courses = courses;
    sail.total = courses.length;
    sail.results = Array<undefined>(sail.total);
    sail.done = 0;
    const maxParallelRoutine = config.maxParallelRoutine || 1;
    sail.taskPool = new TaskPool(maxParallelRoutine);

    return sail;
  }

  private async startRoutine(index: number, course: Course, sailer: Sailer) {
    this.results[index] = {
      status: "processing",
    };
    try {
      this.results[index] = await waitWithTimeout(
        course.startRoutine(sailer),
        course.meta.timeLimit ?? 120_000 /* 2 minutes */,
      );
    } catch (error) {
      this.results[index] = {
        status: JobStatus.Error,
        message: String((error as Error).message || error),
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
          status: "queued" as const,
        },
    );
  }

  public getStatus() {
    return {
      status: this.status,
      total: this.total,
      done: this.done,
      jobs: this.getResults(),
    };
  }

  public async stop() {
    // not implemented
  }
}
