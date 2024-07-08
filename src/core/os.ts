import { exec } from "child_process";

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

abstract class OSOperation {}

class WindowsOperation extends OSOperation {
  async getBrowserPath(browser: "chrome" | "firefox"): Promise<string | null> {
    // run system command
    const out = await systemExec(
      `reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths" /s /f \\${browser}.exe`,
    );
    const chromeExe = out.stdout
      .toString()
      .trim()
      .split("\r\n")
      .find((line) => line.includes("REG_SZ"));
    if (!chromeExe) {
      return null;
    }
    const path = chromeExe.split("    ")[3];
    return path;
  }

  async checkBrowserRunning(browser: "chrome" | "firefox"): Promise<boolean> {
    const out = await systemExec(
      `tasklist /FI "IMAGENAME eq ${browser}.exe" /NH /FO CSV`,
    );
    const chromeExe = out.stdout.toString().trim();
    return chromeExe.includes(`${browser}.exe`);
  }

  getChromeProfilePath(): string {
    return `${process.env.LOCALAPPDATA}\\Google\\Chrome\\User Data`;
  }
}

export async function getChromePaths() {
  let chromePath: string;
  let profilePath: string;
  switch (process.platform) {
    case "win32": {
      const op = new WindowsOperation();
      const chromeRunning = await op.checkBrowserRunning("chrome");
      if (chromeRunning) {
        console.log("Chrome is already running, please close it first");
        throw new Error("Chrome is already running, please close it first");
      }
      chromePath = await op.getBrowserPath("chrome");
      profilePath = op.getChromeProfilePath();
      break;
    }
    default:
      console.log("This is not a Windows machine");
      throw new Error("This is not a Windows machine");
  }

  return { chromePath, profilePath };
}
