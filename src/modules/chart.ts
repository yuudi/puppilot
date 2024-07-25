import { promises as fs } from "fs";
import path from "path";
import { RoutineFuncSchema } from "../types";
import { Course } from "./course";
import { DataHouse } from "./database";
import { Market } from "./market";
import { importFile } from "./os";

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
    chart.market = await Market.create(await chart.db.getStore("meta/market"));
    return chart;
  }

  private async loadCourses() {
    // find all files in the directory
    const fullDirPath = path.resolve(this.routinePath);
    await fs.mkdir(fullDirPath, { recursive: true });
    const files = await fs.readdir(fullDirPath);
    // filter out non-js files
    const routineFiles = files.filter(
      (file) => file.endsWith(".mjs") && !file.startsWith("_"),
    );
    // load all routines

    await Promise.all(
      routineFiles.map(async (routineFile) => {
        const fullPath = path.resolve(fullDirPath, routineFile);
        try {
          const course = await Course.create(fullPath);
          this.courseMap.set(course.meta.id, course);
        } catch (error) {
          console.error(`Error loading routine from ${fullPath}`);
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

  public async deleteRoutine(routineId: string): Promise<0 | 1> {
    const course = this.courseMap.get(routineId);
    if (!course) {
      return 0;
    }
    await course.delete();
    this.courseMap.delete(routineId);
    return 1;
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
    const fileName = path.basename(url);
    // rename extension to .mjs
    const extIndex = fileName.lastIndexOf(".");
    const newFileName = fileName.slice(0, extIndex) + ".mjs";
    const tmpPath = path.resolve(this.routinePath, `_${newFileName}`);
    await fs.writeFile(tmpPath, routineText);
    try {
      await this.validateRoutine(tmpPath);
    } catch (error) {
      await fs.unlink(tmpPath);
      throw error;
    }
    const fullFilePath = path.resolve(this.routinePath, newFileName);

    await fs.rename(tmpPath, fullFilePath);

    const course = await Course.create(fullFilePath);
    this.courseMap.set(course.meta.id, course);
  }

  public addShop(url: string, displayName?: string) {
    return this.market.addShop(url, displayName);
  }

  private async validateRoutine(routinePath: string) {
    const routineMod = (await importFile(routinePath)) as Record<
      string,
      unknown
    >;
    const routineFunc = RoutineFuncSchema.parse(routineMod.default);
    return routineFunc;
  }
}
