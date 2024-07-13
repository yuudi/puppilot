import { Routine, RoutineClassSchema } from "../types/routine.js";
import { importFile } from "./os.js";
import { Sailer } from "./sail.js";

type RoutineMeta = Pick<
  typeof Routine,
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
  private routineClass!: typeof Routine;

  constructor(public filePath: string) {}

  public get meta(): Readonly<RoutineMeta> {
    return this.routineClass;
  }

  public async loadRoutine(): Promise<Pick<typeof Routine, "id">> {
    const routineMod = (await importFile(this.filePath)) as Record<
      string,
      unknown
    >;
    this.routineClass = RoutineClassSchema.parse(routineMod.default);
    return this.routineClass;
  }

  public async startRoutine(sailer: Sailer) {
    const routine = new this.routineClass(
      sailer.getNewPage,
      sailer.getStore.bind(null, "routine/" + this.routineClass.id),
    );
    return routine.start();
  }
}
