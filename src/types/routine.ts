import { Page } from "puppeteer-core";
import { JobResult, Store } from "puppilot-routine-base";
import { z } from "zod";

export declare class Routine {
  public static readonly displayName: string;
  public static readonly author?: string;
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

export const RoutineClassSchema = z.object({
  displayName: z.string(),
  id: z.string(),
  author: z.string().optional(),
  reportEmail: z.string().optional(),
  reportUrl: z.string().optional(),
  description: z.string().optional(),
  timeLimit: z.number(),
  start: z
    .function()
    .args()
    .returns(z.promise(z.object({ status: z.string(), message: z.string() }))),
});
