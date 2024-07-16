import puppeteer, {
  Browser,
  Page,
  PuppeteerLaunchOptions,
} from "puppeteer-core";

export class PuppeteerBrowser {
  private browser!: Browser;

  private defaultPage: Page | null = null;

  public static async create(config: PuppeteerLaunchOptions) {
    const browser = new PuppeteerBrowser();
    browser.browser = await puppeteer.launch(config);
    const pages = await browser.browser.pages();
    browser.defaultPage = pages[0];
    browser.browser.on("disconnected", () => {
      process.exit(0);
    });
    return browser;
  }

  public getBrowser() {
    return this.browser;
  }

  public async getPage() {
    if (this.defaultPage) {
      return this.defaultPage;
    }
    const page = await this.browser.newPage();
    this.defaultPage = page;
    return page;
  }

  public async bringDefaultPageToFront() {
    if (this.defaultPage) {
      await this.defaultPage.bringToFront();
    }
  }

  public async getNewPage() {
    return this.browser.newPage();
  }

  public async close() {
    await this.browser.close();
  }
}
