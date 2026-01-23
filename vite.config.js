import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "renderer",
  plugins: [react()],
  base: "./",
  define: {
    process: {},
    "process.env": {}
  },
  optimizeDeps: {
    exclude: ["dotenv"]
  }
});
