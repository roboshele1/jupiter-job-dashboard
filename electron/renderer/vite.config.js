import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../../");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectRoot, "");
  return {
    plugins: [react()],
    define: {
      process: {},
      "process.env": {
        VITE_ANTHROPIC_API_KEY: JSON.stringify(env.VITE_ANTHROPIC_API_KEY ?? ""),
      }
    },
    resolve: {
      alias: {
        dotenv: path.resolve(__dirname, "stubs/dotenv.js")
      }
    }
  };
});
