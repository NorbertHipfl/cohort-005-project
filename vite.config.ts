import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { realpathSync } from "node:fs";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  server: {
    fs: {
      // Worktree previews may reuse the main checkout's node_modules.
      allow: [process.cwd(), realpathSync("node_modules")],
    },
  },
});
