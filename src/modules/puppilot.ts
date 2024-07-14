import { Config } from "../config";
import { PuppeteerBrowser } from "./browser";
import { Chart } from "./chart";
import { getOSOperations } from "./os";
import { Sail, Sailer } from "./sail";

export class Puppilot {
  private instanceId!: string;
  private browser!: PuppeteerBrowser;
  private chart!: Chart;
  private sails: Sail[] = [];

  public static async create(config: Config) {
    const puppilot = new Puppilot();

    puppilot.instanceId = String(new Date().getTime());

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
  public listRoutines() {
    return this.chart.listCourses();
  }
  public getRoutine(routineId: string) {
    return this.chart.getCourse(routineId)?.meta;
  }
  public listMarketRoutines() {
    return this.chart.getMarketRoutines();
  }
  public downloadMarketRoutine(url: string) {
    return this.chart.downloadRoutine(url);
  }
  public addShop(url: string, displayName?: string) {
    return this.chart.addShop(url, displayName);
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
    const instanceSailId = this.sails.push(sail) - 1;
    return this.instanceId + "-" + instanceSailId.toString();
  }
  public getSails() {
    return this.sails.map((_, index) => ({
      id: this.instanceId + "-" + index.toString(),
    }));
  }
  public getSail(instanceId: string, sailId: number) {
    if (instanceId !== this.instanceId) {
      return;
    }
    return this.sails.at(sailId)?.getStatus();
  }
  public async close() {
    await this.browser.close();
    process.exit(0);
  }
}
