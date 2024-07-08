import { parse as tomlParse } from "@iarna/toml";
import { promises as fs } from "fs";
import * as zod from "zod";

const defaultConfigContent = `[browser]
browser = "chrome"
# browser = "firefox"
headless = false
executablePath = ""
userDataDir = ""
`;

const configPath = "./puppilot-data/config.toml";

const configSchema = zod.object({
  browser: zod.object({
    browser: zod.union([zod.literal("chrome"), zod.literal("firefox")]),
    headless: zod.boolean().optional(),
    executablePath: zod.string().optional(),
    userDataDir: zod.string().optional(),
  }),
});

export type Config = zod.infer<typeof configSchema>;

export async function readConfig() {
  try {
    await fs.access(configPath);
  } catch {
    await fs.mkdir("./puppilot-data", { recursive: true });
    await fs.writeFile(configPath, defaultConfigContent);
  }
  const configContent = await fs.readFile(configPath, "utf-8");
  const config = tomlParse(configContent);
  return configSchema.parse(config);
}
