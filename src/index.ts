import express, { RequestHandler, Response } from "express";
import * as zod from "zod";
import { readConfig } from "./config.js";
import { Puppilot } from "./core/puppilot.js";
import {
  ApiError,
  ApiGetRoutines,
  ApiGetSails,
  ApiGetSailsSailId,
  ApiPostSails,
} from "./types";

const host = "127.0.0.1";
const port = 9900;

void (async function () {
  const config = await readConfig();
  const puppilot = await Puppilot.create(config);

  const app = express();
  app.use(express.json());

  const api = express.Router();
  app.use("/api/v0", api);

  api.get("/routines", (async (req, res: Response<ApiGetRoutines>) => {
    const shouldRefresh = req.query.refresh === "true";
    if (shouldRefresh) {
      await puppilot.refreshRoutines();
    }
    const routines = puppilot.listRoutines();
    res.json({
      routines: routines.map(({ meta: { id, displayName } }) => ({
        id,
        name: displayName,
      })),
    });
  }) as RequestHandler);

  api.post("/sails", ((req, res: Response<ApiPostSails | ApiError>) => {
    const parseResult = zod
      .object({ routines: zod.array(zod.string()).nonempty() })
      .safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.toString() });
      return;
    }
    const routines = parseResult.data.routines;
    const sailId = puppilot.sail(routines);
    res.json({ sailId });
  }) as RequestHandler);

  api.get("/sails", ((req, res: Response<ApiGetSails>) => {
    return res.json({ sails: puppilot.getSails() });
  }) as RequestHandler);

  api.get("/sails/:sailId", ((
    req,
    res: Response<ApiGetSailsSailId | ApiError>,
  ) => {
    const sailId = +req.params.sailId;
    const sail = puppilot.getSail(sailId);
    if (!sail) {
      res.status(404).json({ error: "Sail not found" });
      return;
    }
    res.json(sail);
  }) as RequestHandler);

  api.put("/action/close", (async (req, res) => {
    await puppilot.close();
    res.json({});
  }) as RequestHandler);

  process.on("SIGINT", () => {
    console.log("Received SIGINT");
    void puppilot.close();
  });

  app.listen(port, host, () => {
    const site = `http://${host}:${String(port)}`;
    void puppilot.showSite(site);
    console.log(`Server is running on ${site}`);
  });
})();
