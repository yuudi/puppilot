import { promises as fs } from "fs";
import path from "path";
import { RoutineClassSchema } from "../types/routine.js";
import { Course } from "./course.js";
import { DataHouse } from "./database.js";
import { Market } from "./market.js";
import { importString } from "./os.js";

export class Chart {
  private routinePath!: string;
  private db!: DataHouse;
  private courseMap = new Map<string, Course>();
  private market!: Market;

  public static async create(routinePath: string) {
    const chart = new Chart();
    // initialize database
    chart.db = await DataHouse.create("puppilot", "./puppilot-data/db");
    chart.routinePath = routinePath;
    await chart.loadCourses();
    chart.market = await Market.create(chart.db.getStore("meta/market"));
    return chart;
  }

  private async loadCourses() {
    // find all files in the directory
    const fullDirPath = path.resolve(this.routinePath);
    await fs.mkdir(fullDirPath, { recursive: true });
    const files = await fs.readdir(fullDirPath);
    // filter out non-js files
    const routineFile = files.filter(
      (file) => file.endsWith(".js") && !file.startsWith("_"),
    );
    // load all routines
    const courses = routineFile.map(
      (file) => new Course(path.join(fullDirPath, file)),
    );
    await Promise.all(
      courses.map(async (course) => {
        try {
          const routine = await course.loadRoutine();
          this.courseMap.set(routine.id, course);
        } catch (error) {
          console.error(`Error loading routine from ${course.filePath}`);
          console.error(error);
        }
      }),
    );
  }

  public listCourses(): readonly Course[] {
    return Array.from(this.courseMap.values());
  }

  public getCourse(routineId: string): Readonly<Course> | undefined {
    return this.courseMap.get(routineId);
  }

  public getCourses(routineIds: string[]) {
    return routineIds.map((id) => {
      const course = this.courseMap.get(id);
      if (!course) {
        throw new Error(`Routine with id "${id}" not found`);
      }
      return course;
    });
  }

  public getDbStore(store: string) {
    return this.db.getStore(store);
  }

  public async refreshFolder() {
    await this.loadCourses();
  }

  public async getMarketRoutines() {
    return this.market.getRoutines();
  }

  public async downloadRoutine(url: string) {
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Failed to fetch routines from ${url}`);
    }
    const routineText = await resp.text();
    await this.validateRoutine(routineText);
    const fileName = path.basename(url);
    const fullFilePath = path.resolve(this.routinePath, fileName);

    await fs.writeFile(fullFilePath, routineText);

    const course = new Course(fullFilePath);
    await course.loadRoutine();
    this.courseMap.set(course.meta.id, course);
  }

  public addShop(url: string, displayName?: string) {
    return this.market.addShop(url, displayName);
  }

  private async validateRoutine(routineText: string) {
    const routineMod = (await importString(routineText)) as Record<
      string,
      unknown
    >;
    const routineClass = RoutineClassSchema.parse(routineMod.default);
    return routineClass;
  }
}
