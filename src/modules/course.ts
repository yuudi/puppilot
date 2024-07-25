import { unlink } from "fs/promises";
import * as puppeteer from "puppeteer-core";
import { Routine, RoutineFuncSchema } from "../types";
import { importFile } from "./os";
import { Sailer } from "./sail";

type RoutineMeta = Pick<
  Routine,
  | "id"
  | "version"
  | "displayName"
  | "author"
  | "description"
  | "reportEmail"
  | "reportUrl"
  | "timeLimit"
>;

export class Course {
  private routine!: Routine;
  private filePath!: string;

  public get meta(): Readonly<RoutineMeta> {
    return this.routine;
  }

  public static async create(filePath: string): Promise<Course> {
    const course = new Course();
    course.filePath = filePath;
    const routineMod = (await importFile(filePath)) as Record<string, unknown>;
    course.routine = RoutineFuncSchema.parse(routineMod.default)() as Routine;
    return course;
  }

  public async startRoutine(sailer: Sailer) {
    return this.routine.start(
      {
        getPage: sailer.getNewPage,
        getStore: sailer.getStore.bind(null, "routine/" + this.routine.id),
      },
      { puppeteer },
    );
  }

  public async delete() {
    await unlink(this.filePath);
  }
}
