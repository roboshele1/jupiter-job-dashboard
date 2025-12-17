// dotenv_config.js - safely expose environment variables to the front-end

// Use Vite's import.meta.env for front-end
export const VITE_POLYGON_API_KEY = import.meta.env.VITE_POLYGON_API_KEY || "";

// Any other env variables can be added here similarly

