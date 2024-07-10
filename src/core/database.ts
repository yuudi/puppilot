import { promises as fs } from "fs";
import { Level } from "level";
import { resolve } from "path";
import { JSONValue, Store } from "../types";

export class DataHouse {
  private db!: Level;

  public static async create(name: string, path: string) {
    const dataHouse = new DataHouse();
    const fullPath = resolve(path, name);
    await fs.mkdir(fullPath, { recursive: true });
    dataHouse.db = new Level(fullPath);
    return dataHouse;
  }

  public getStore(store: string): Store {
    const db = this.db;
    return {
      async get<T extends JSONValue>(key: string) {
        const value = await db.get(`${store}/${key}`);
        return JSON.parse(value) as T;
      },
      async set(key: string, value: JSONValue) {
        await db.put(`${store}/${key}`, JSON.stringify(value));
      },
    };
  }
}
