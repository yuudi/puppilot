import express from "express";
import * as zod from "zod";
import { readConfig } from "./config.js";
import { Puppilot } from "./core/puppilot.js";

const port = 9900;

(async function () {
  const config = await readConfig();
  const puppilot = new Puppilot(config);
  await puppilot.init();

  const app = express();
  app.use(express.json());

  app.get("/", (req, res) => {
    res.send("Hello World!");
  });

  const api = express.Router();
  app.use("/api/v0", api);

  api.get("/routines", async (req, res) => {
    const shouldRefresh = req.query.refresh === "true";
    if (shouldRefresh) {
      await puppilot.refreshRoutines();
    }
    const routines = await puppilot.listRoutines();
    res.json(
      routines.map(({ meta: { id, displayName } }) => ({
        id,
        name: displayName,
      })),
    );
  });

  api.post("/sails", async (req, res) => {
    const parseResult = zod
      .object({ routines: zod.array(zod.string()).nonempty() })
      .safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error });
      return;
    }
    const routines = parseResult.data.routines;
    const sailId = await puppilot.sail(routines);
    res.json({ sailId });
  });

  api.get("/sails", async (req, res) => {
    return res.json(puppilot.getSails());
  });

  api.get("/sails/:sailId", async (req, res) => {
    const sailId = +req.params.sailId;
    const sail = await puppilot.getSail(sailId);
    if (!sail) {
      res.status(404).json({ error: "Sail not found" });
      return;
    }
    res.json(sail);
  });

  api.put("/action/close", async (req, res) => {
    await puppilot.close();
    res.json({});
  });

  process.on("SIGINT", () => {
    console.log("Received SIGINT");
    puppilot.close();
  });

  app.listen(port, "127.0.0.1", () => {
    puppilot.showSite(`http://localhost:${port}`);
    console.log(`Server is running on port ${port}`);
  });
})();
