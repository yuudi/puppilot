import { Config } from "../config.js";
import { PuppeteerBrowser } from "./browser.js";
import { Chart } from "./chart.js";
import { getOSOperations } from "./os.js";
import { Sail, Sailer } from "./sail.js";

export class Puppilot {
  private browser!: PuppeteerBrowser;
  private chart!: Chart;
  private sails: Sail[] = [];

  public static async create(config: Config) {
    const puppilot = new Puppilot();

    const OSOperation = await getOSOperations();
    const executablePath =
      config.browser.executablePath ||
      (await OSOperation.getBrowserPath(config.browser.browser));
    const userDataDir =
      config.browser.userDataDir || (await OSOperation.getChromeProfilePath());
    if (!executablePath || !userDataDir) {
      throw new Error("Chrome path not found");
    }

    puppilot.browser = await PuppeteerBrowser.create({
      executablePath,
      headless: config.browser.headless ?? false,
      userDataDir,
      args: ["--profile-directory=Default"],
    });

    puppilot.chart = await Chart.create("./puppilot-data/routines");
    return puppilot;
  }
  public async showSite(url: string) {
    const page = await this.browser.getPage();
    await page.goto(url);
  }
  public async refreshRoutines() {
    return this.chart.refreshFolder();
  }
  // public async downloadRoutine(url: string) {}
  public listRoutines() {
    return this.chart.listCourses();
  }
  public getRoutine(routineId: string) {
    return this.chart.getCourse(routineId)?.meta;
  }
  public sail(routineIds: string[]) {
    const courses = this.chart.getCourses(routineIds);
    const sailer: Sailer = {
      getNewPage: async () => this.browser.getNewPage(),
      getStore: (store: string) => this.chart.getDbStore(store),
    };
    const sail = Sail.create(courses, {
      maxParallelRoutine: 1,
    });
    void sail.start(sailer);
    return this.sails.push(sail) - 1;
  }
  public getSails() {
    return this.sails.map((_, index) => ({
      id: index,
    }));
  }
  public getSail(sailId: number) {
    return this.sails.at(sailId)?.getStatus();
  }
  public async close() {
    await this.browser.close();
    process.exit(0);
  }
}
