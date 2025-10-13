import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath, URL } from "node:url";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    define: {
      __APP_ENV__: JSON.stringify(env.VITE_ENV),
    },
    resolve: {
      alias: {
        "@": path.resolve(
          path.dirname(fileURLToPath(import.meta.url)),
          "./src"
        ),
      },
    },
    build: {
      outDir: "dist",
      sourcemap: mode === "staging",
    },
    server: {
      port: 5173,
      host: true,
    },
  };
});
