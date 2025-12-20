import fs from "fs";
import path from "path";

export function loadSnapshot(tag = "T0") {
  try {
    const p = path.resolve(`./engine/snapshots/${tag}.json`);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

