import { promises as fs } from "fs";
import path from "path";
import { Course } from "./course.js";
import { DataHouse } from "./database.js";

export class Chart {
  private courses: Course[];
  private db: DataHouse;
  private routineMap: Map<string, Course> = new Map();
  constructor(private readonly routinePath: string) {}

  public async init() {
    // initialize database
    this.db = new DataHouse("puppilot", "./puppilot-data/db");
    await this.db.init();
    // find all files in the directory
    const fullDirPath = path.resolve(this.routinePath);
    await fs.mkdir(fullDirPath, { recursive: true });
    const files = await fs.readdir(fullDirPath);
    // filter out non-js files
    const routineFile = files.filter((file) => file.endsWith(".js"));
    // load all routines
    this.courses = routineFile.map(
      (file) => new Course(path.join(fullDirPath, file)),
    );
    await Promise.all(
      this.courses.map(async (course) => {
        try {
          const routine = await course.loadRoutine();
          this.routineMap.set(routine.id, course);
        } catch (error) {
          console.error(`Error loading routine from ${course.filePath}`);
          console.error(error);
        }
      }),
    );
  }

  public listCourses() {
    return this.courses;
  }

  public getCourses(routineIds: string[]) {
    return routineIds.map((id) => {
      const course = this.routineMap.get(id);
      if (!course) {
        throw new Error(`Routine with id ${id} not found`);
      }
      return course;
    });
  }

  public getDbStore(store: string) {
    return this.db.getStore(store);
  }

  public async refreshFolder() {
    await this.init();
  }
}
