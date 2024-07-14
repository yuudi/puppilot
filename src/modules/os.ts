import { exec } from "child_process";
import { resolve as pathResolve } from "path";
import { Promisable } from "../types";

async function systemExec(command: string) {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

interface OSOperation {
  getBrowserPath(browser: "chrome" | "firefox"): Promisable<string | null>;
  getChromeProfilePath(): Promisable<string | null>;
  checkOS(browser: "chrome" | "firefox"): Promisable<boolean>;
}

const windowsOperation: OSOperation = {
  async getBrowserPath(browser: "chrome" | "firefox"): Promise<string | null> {
    // run system command
    const out = await systemExec(
      `reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths" /s /f \\${browser}.exe`,
    );
    const chromeExe = out.stdout
      .trim()
      .split("\r\n")
      .find((line) => line.includes("REG_SZ"));
    if (!chromeExe) {
      return null;
    }
    const path = chromeExe.split("    ")[3];
    return path;
  },

  async checkOS(browser: "chrome" | "firefox"): Promise<boolean> {
    // windows does not allow two chrome instance
    const out = await systemExec(
      `tasklist /FI "IMAGENAME eq ${browser}.exe" /NH /FO CSV`,
    );
    const chromeExe = out.stdout.toString().trim();
    return !chromeExe.includes(`${browser}.exe`);
  },

  getChromeProfilePath(): string | null {
    const localAppData = process.env.LOCALAPPDATA;
    if (!localAppData) {
      return null;
    }
    return `${localAppData}\\Google\\Chrome\\User Data`;
  },
};

const linuxOperation: OSOperation = {
  async getBrowserPath(browser: "chrome" | "firefox"): Promise<string | null> {
    const out = await systemExec(`which ${browser}`);
    const path = out.stdout.trim();
    if (path) {
      return path;
    }
    // test chromium if browser is chrome
    if (browser === "chrome") {
      const out = await systemExec("which chromium");
      const path = out.stdout.trim();
      if (path) {
        return path;
      }
    }
    return null;
  },
  getChromeProfilePath() {
    throw new Error("not implemented yet");
  },
  checkOS() {
    return true;
  },
};

export async function getOSOperations() {
  let op;
  switch (process.platform) {
    case "win32": {
      op = windowsOperation;
      break;
    }
    case "linux":
      op = linuxOperation;
      break;
    default:
      console.log("This is not a Windows machine");
      throw new Error("This is not a Windows machine");
  }
  const osCheckResult = await op.checkOS("chrome");
  if (!osCheckResult) {
    console.log("Chrome is already running, please close it first");
    throw new Error("Chrome is already running, please close it first");
  }

  return op;
}

export async function importFile(filePath: string): Promise<unknown> {
  const fullPath = pathResolve(filePath);
  switch (process.platform) {
    case "win32":
      return import(`file://${fullPath}`);
    case "linux":
    case "darwin":
      return import(`file://localhost${fullPath}`);
    default:
      throw new Error("not implemented yet");
  }
}

export function getTmpDir(): string {
  switch (process.platform) {
    case "win32":
      return process.env.TEMP || "C:\\Windows\\Temp";
    case "linux":
      return process.env.TMPDIR || "/tmp";
    default:
      throw new Error("not implemented yet");
  }
}
