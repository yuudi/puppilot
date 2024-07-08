import puppeteer, {
  Browser,
  Page,
  PuppeteerLaunchOptions,
} from "puppeteer-core";

export class PuppeteerBrowser {
  private browser: Browser | null = null;
  private defaultPage: Page | null = null;
  constructor() {}

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

  public async getNewPage() {
    return this.browser.newPage();
  }

  public async close() {
    await this.browser.close();
    this.browser = null;
  }

  public async init(config: PuppeteerLaunchOptions) {
    this.browser = await puppeteer.launch(config);
    const pages = await this.browser.pages();
    this.defaultPage = pages[0];
    this.browser.on("disconnected", () => {
      process.exit(0);
    });
  }
}
