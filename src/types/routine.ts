import { Page } from "puppeteer-core";

type JobStatus = "completed" | "failed" | "skipped" | "error";

export interface JobResult {
  status: JobStatus;
  message: string;
}

// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style, @typescript-eslint/consistent-type-definitions
type JSONObject = {
  [key: string]: JSONValue;
};
type JSONArray = JSONValue[];
export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONObject
  | JSONArray;

export interface Store {
  get<T extends JSONValue>(key: string): Promise<T>;
  set(key: string, value: JSONValue): Promise<void>;
}

export declare class Routine {
  public static readonly displayName: string;
  public static readonly author?: string;
  public static readonly reportEmail?: string;
  public static readonly reportUrl?: string;
  public static readonly description?: string;
  public static readonly timeLimit: number;
  public static get id(): string;
  constructor(
    getPage: () => Promise<Page> | Page,
    getStore: () => Promise<Store> | Store,
  );
  public start(): Promise<JobResult>;
}
