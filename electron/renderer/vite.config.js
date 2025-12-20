import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      dotenv: path.resolve(__dirname, "stubs/dotenv.js")
    }
  }
});

