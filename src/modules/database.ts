import { promises as fs } from "fs";
import { resolve } from "path";
import { JSONValue, Promisable, Store } from "../types";

export class DataHouse {
  private directoryPath!: string;

  public static create(name: string, path: string): Promisable<DataHouse> {
    const dataHouse = new DataHouse();
    const fullPath = resolve(path, name);
    dataHouse.directoryPath = fullPath;
    return dataHouse;
  }

  public async getStore(store: string): Promise<Store> {
    const subPath = resolve(this.directoryPath, store);
    await fs.mkdir(subPath, { recursive: true });
    return {
      async get<T extends JSONValue>(key: string) {
        const fullPath = resolve(subPath, key);
        const value = await fs
          .readFile(fullPath, "utf-8")
          .catch(() => undefined);
        return value === undefined ? undefined : (JSON.parse(value) as T);
      },
      async set(key: string, value: JSONValue) {
        const fullPath = resolve(subPath, key);
        await fs.writeFile(fullPath, JSON.stringify(value));
      },
    };
  }
}

// export class DataHouse {
//   private db!: Level;

//   public static async create(name: string, path: string) {
//     const dataHouse = new DataHouse();
//     const fullPath = resolve(path, name);
//     await fs.mkdir(fullPath, { recursive: true });
//     dataHouse.db = new Level(fullPath);
//     return dataHouse;
//   }

//   public getStore(store: string): Store {
//     const db = this.db;
//     return {
//       async get<T extends JSONValue>(key: string) {
//         const value = await db.get(`${store}/${key}`).catch(() => undefined);
//         return value === undefined ? undefined : (JSON.parse(value) as T);
//       },
//       async set(key: string, value: JSONValue) {
//         await db.put(`${store}/${key}`, JSON.stringify(value));
//       },
//     };
//   }
// }
