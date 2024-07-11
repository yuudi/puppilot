import zod from "zod";

const shopResponseSchema = zod.object({
  routines: zod.array(
    zod.object({
      id: zod.string(),
      displayName: zod.string(),
      url: zod.string(),
    }),
  ),
});

export class Shop {
  public url!: string;
  public displayName!: string;
  private routines: zod.infer<typeof shopResponseSchema>["routines"] = [];

  public static async create(url: string, displayName: string) {
    const shop = new Shop();
    shop.url = url;
    shop.displayName = displayName;
    try {
      shop.routines = await shop.fetchRoutines();
    } catch (error) {
      console.error(error);
      throw new Error("cannot load shop", { cause: error });
    }
    return shop;
  }

  private async fetchRoutines() {
    const resp = await fetch(this.url);
    if (!resp.ok) {
      throw new Error(`Failed to fetch routines from ${this.url}`);
    }
    const routines = shopResponseSchema.parse(await resp.json()).routines;
    return routines.map((routine) => {
      routine.url = new URL(routine.url, this.url).href; // resolve relative url
      return routine;
    });
  }

  public getRoutines(): Readonly<typeof this.routines> {
    return this.routines;
  }
}
