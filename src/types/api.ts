export type SailStatus = "created" | "processing" | "completed";
export type SailJobStatus =
  | {
      status: "completed" | "failed" | "skipped" | "error";
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
