import { Routine } from "../types.js";
import { Sailer } from "./sail.js";

type RoutineMeta = Pick<
  typeof Routine,
  | "id"
  | "displayName"
  | "author"
  | "description"
  | "reportEmail"
  | "reportUrl"
  | "timeLimit"
>;

export class Course {
  private routineClass: typeof Routine;

  constructor(public filePath: string) {}

  public get meta(): RoutineMeta {
    return this.routineClass;
  }

  public async loadRoutine(): Promise<Pick<typeof Routine, "id">> {
    const routineMod = await import("file://" + this.filePath);
    this.routineClass = routineMod?.default;

    // check if default is a class
    if (typeof this.routineClass !== "function") {
      throw new Error("Routine must have a default class");
    }
    const id = this.routineClass.id;
    if (typeof id !== "string") {
      throw new Error("Routine must have a static id property");
    }
    if (id === "") {
      throw new Error("Routine id must not be empty");
    }
    return this.routineClass;
  }

  public async startRoutine(sailer: Sailer) {
    const routine = new this.routineClass(
      sailer.getNewPage,
      sailer.getStore.bind(null, this.routineClass.id),
    );
    return routine.start();
  }
}

// async function importString(content: string) {
//   const b64File = "data:text/javascript;base64," + btoa(content);
//   return import(b64File);
// }
