import { Store } from "../types";
import { Shop } from "./shop";

interface shopInfo {
  url: string;
  displayName: string;
}

const defaultShops: shopInfo[] = [
  {
    url: "https://files.puppilot.yuudi.dev/puppilot-routines/index.json",
    displayName: "Official Shop Mirror",
  },
  {
    url: "https://puppilot-org.github.io/puppilot-routines/index.json",
    displayName: "Official Shop",
  },
];

export class Market {
  private store!: Store;
  private shops: Shop[] = [];

  public static async create(store: Store) {
    const market = new Market();
    market.store = store;
    const shopInfos: shopInfo[] =
      (await store.get<
        {
          url: string;
          displayName: string;
        }[]
      >("shops")) ?? defaultShops;
    for (const shopInfo of shopInfos) {
      void market.initShop(shopInfo);
    }
    return market;
  }

  private async initShop(shopInfo: shopInfo) {
    const { url, displayName } = shopInfo;
    try {
      this.shops.push(await Shop.create(url, displayName));
    } catch (error) {
      console.error(error);
    }
  }

  public getShops(): readonly shopInfo[] {
    return this.shops;
  }

  private getShopsObject() {
    return this.shops.map((shop) => ({
      url: shop.url,
      displayName: shop.displayName,
    }));
  }

  public async addShop(url: string, displayName?: string) {
    const shop = await Shop.create(
      url,
      displayName || "new shop " + String(this.shops.length + 1),
    );
    this.shops.push(shop);
    await this.store.set("shops", this.getShopsObject());
  }

  public async deleteShop(url: string) {
    const index = this.getShops().findIndex((shop) => shop.url === url);
    if (index === -1) {
      return 0;
    }
    this.shops.splice(index, 1);
    await this.store.set("shops", this.getShopsObject());
    return 1;
  }

  public async getRoutines() {
    const routines = await Promise.all(
      this.shops.map((shop) => shop.getRoutines()),
    );
    return this.removeDuplicateRoutines(routines.flat());
  }

  private removeDuplicateRoutines(routines: ReturnType<Shop["getRoutines"]>) {
    const map = new Map<string, ReturnType<Shop["getRoutines"]>[number]>();
    routines.forEach((routine) => {
      const r = map.get(routine.id);
      if (r === undefined || r.updateTime < routine.updateTime) {
        map.set(routine.id, routine);
        return;
      }
    });
    return Array.from(map.values());
  }
}
