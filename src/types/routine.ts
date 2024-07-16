import * as puppeteer from "puppeteer-core";
import * as zod from "zod";
import { JobStatus } from "./api";
import { Promisable } from "./common";

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
  get<T extends JSONValue>(key: string): Promise<T | undefined>;
  set(key: string, value: JSONValue): Promise<void>;
}

type SemverArray = (number | string)[];

export interface Routine {
  /**
   * id of the routine, the id should follow java package naming convention
   * @example
   * ```
   * io.github.user.routine-name
   * com.your-own-domain.project-name.routine-name
   * ```
   */
  readonly id: string;
  /** name of your routine, it is no difference than `name` */
  readonly displayName: string;
  /** version to control update of routine
   * use number or semver
   * @example
   * ```ts
   * static version = 1;
   * static version = "1.0.0";
   * static version = [1, 0, 0];
   * static version = "1.0.0-beta.1";
   * static version = [1, 0, 0, "beta", 1];
   * ```
   */
  readonly version: string | number | SemverArray;
  /**
   * author of the routine
   */
  readonly author?: string;
  /**
   * email of the author or any email to report issue
   */
  readonly reportEmail?: string;
  /**
   * url of the author or any url to report issue
   */
  readonly reportUrl?: string;
  /**
   * description of the routine, the length is not limited
   */
  readonly description?: string;
  /**
   * alternative names of the routine, so that user can search by these names
   */
  readonly altNames?: string[];
  /**
   * time limit by milliseconds
   */
  readonly timeLimit?: number;
  start(
    sailer: {
      getPage(): Promisable<puppeteer.Page>;
      getStore(): Promisable<Store>;
    },
    mods: { puppeteer: typeof puppeteer },
  ): Promise<Readonly<JobResult>>;
}

export type RoutineFunc = () => Routine;

export const RoutineSchema = zod.object({
  id: zod.string(),
  displayName: zod.string(),
  version: zod.union([
    zod.string(),
    zod.number(),
    zod.array(zod.union([zod.string(), zod.number()])),
  ]),
  author: zod.string().optional(),
  reportEmail: zod.string().optional(),
  reportUrl: zod.string().optional(),
  description: zod.string().optional(),
  altNames: zod.array(zod.string()).optional(),
  timeLimit: zod.number().optional(),
  start: zod.function(),
});
export const RoutineFuncSchema = zod.function().returns(RoutineSchema);
