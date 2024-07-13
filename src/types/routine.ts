import { Page } from "puppeteer-core";
import { JobResult, Store } from "puppilot-routine-base";
import { z } from "zod";

export declare class Routine {
  public static readonly displayName: string;
  public static readonly author?: string;
  public static readonly version: string | number | (number | string)[];
  public static readonly reportEmail?: string;
  public static readonly reportUrl?: string;
  public static readonly description?: string;
  public static readonly timeLimit: number;
  public static readonly id: string;

  constructor(
    getPage: () => Promise<Page> | Page,
    getStore: () => Promise<Store> | Store,
  );
  public start(): Promise<JobResult>;
}

function isValidNumber(num: unknown): num is number {
  return typeof num === "number" && isFinite(num);
}

function isString(str: unknown): str is string {
  return typeof str === "string";
}

function isOptionalString(str: unknown): str is string | undefined {
  return str === undefined || typeof str === "string";
}

export const RoutineClassSchema = z.custom<typeof Routine>(
  // do some validation, this cannot guarantee the routine is valid but it can help
  (routineClass: typeof Routine) =>
    typeof routineClass === "function" &&
    isString(routineClass.displayName) &&
    isString(routineClass.id) &&
    isOptionalString(routineClass.author) &&
    isOptionalString(routineClass.reportEmail) &&
    isOptionalString(routineClass.reportUrl) &&
    isOptionalString(routineClass.description) &&
    isValidNumber(routineClass.timeLimit),
);
