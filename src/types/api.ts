export const enum JobStatus {
  /** job failed */
  Error = "error",
  /** job failed partially */
  Warning = "warning",
  /** job success but need attention */
  WeakWarning = "weak-warning",
  /** job success */
  Success = "success",
  /** job skipped */
  Dismissed = "dismissed",
}

export type SailStatus = "created" | "processing" | "completed";
export type SailJobStatus =
  | {
      status: JobStatus;
      message: string;
    }
  | {
      status: "processing" | "queued";
    };

interface ApiRoutine {
  id: string;
  displayName: string;
  version: string | number | (number | string)[];
  author?: string;
  description?: string;
}

export interface ApiGetRoutines {
  routines: ApiRoutine[];
}

export interface ApiGetMarketRoutines {
  routines: (ApiRoutine & {
    url: string;
    updateTime: number;
  })[];
}

export interface ApiGetSails {
  sails: {
    id: string;
  }[];
}

export interface ApiPostSails {
  sailId: string;
}

export interface ApiGetSailsSailId {
  status: SailStatus;
  total: number;
  done: number;
  jobs: SailJobStatus[];
}

export interface ApiError {
  error: string;
}
