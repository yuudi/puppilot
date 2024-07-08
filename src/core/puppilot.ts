import { Config } from "../config.js";
import { PuppeteerBrowser } from "./browser.js";
import { Chart } from "./chart.js";
import { getChromePaths } from "./os.js";
import { Sail } from "./sail.js";

export class Puppilot {
  private browser: PuppeteerBrowser;
  private chart: Chart;
  private sails: Sail[] = [];

  constructor(private config: Config) {}

  public async init() {
    const { chromePath, profilePath } = await getChromePaths();

    this.browser = new PuppeteerBrowser();
    await this.browser.init({
      executablePath: chromePath,
      headless: this.config.browser.headless ?? false,
      userDataDir: profilePath,
      args: ["--profile-directory=Default"],
    });

    this.chart = new Chart("./puppilot-data/routines");
    await this.chart.init();
  }
  public async showSite(url: string) {
    const page = await this.browser.getPage();
    await page.goto(url);
  }
  public async refreshRoutines() {
    return this.chart.refreshFolder();
  }
  public async downloadRoutine(url: string) {}
  public async listRoutines() {
    return this.chart.listCourses();
  }
  public async sail(routineIds: string[]) {
    const courses = this.chart.getCourses(routineIds);
    const sailer = {
      getNewPage: async () => this.browser.getPage(),
      getStore: async (store: string) => this.chart.getDbStore(store),
    };
    const sail = new Sail(courses, {
      maxParallelRoutine: 1,
    });
    await sail.init();
    sail.start(sailer);
    return this.sails.push(sail) - 1;
  }
  public getSails() {
    return this.sails.map((_, index) => ({
      id: index,
    }));
  }
  public async getSail(sailId: number) {
    return this.sails[sailId]?.getStatus();
  }
  public async close() {
    await this.browser.close();
    process.exit(0);
  }
}
