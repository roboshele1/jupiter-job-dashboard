// renderer/services/snapshotBoot.js
// Boot hook — read-only snapshot exposure

import { exposeSnapshot } from "./snapshotExpose";

if (typeof window !== "undefined") {
  exposeSnapshot();
}

