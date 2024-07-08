import { promises as fs } from "fs";
import { Level } from "level";
import path from "path";

type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
type JSONObject = { [key: string]: JSONValue };
type JSONArray = JSONValue[];

interface Store {
  get<T extends JSONValue>(key: string): Promise<T>;
  set(key: string, value: JSONValue): Promise<void>;
}

export class DataHouse {
  private db: Level<string, string>;

  constructor(
    private name: string,
    private path: string,
  ) {}

  public async init() {
    const fullPath = path.resolve(this.path, this.name);
    await fs.mkdir(fullPath, { recursive: true });
    this.db = new Level(fullPath);
  }

  public async getStore(store: string): Promise<Store> {
    const db = this.db;
    return {
      async get<T extends JSONValue>(key: string) {
        const value = await db.get(`${store}/${key}`);
        return JSON.parse(value) as T;
      },
      async set(value: JSONValue, key: JSONValue) {
        await db.put(`${store}/${key}`, JSON.stringify(value));
      },
    };
  }
}
