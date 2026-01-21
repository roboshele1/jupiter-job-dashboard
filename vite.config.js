import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "electron/renderer",

  plugins: [react()],

  define: {
    process: {},
    "process.env": {}
  },

  optimizeDeps: {
    exclude: ["dotenv"]
  },

  build: {
    outDir: "../../dist/renderer",
    emptyOutDir: true
  }
});
