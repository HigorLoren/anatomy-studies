import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import preact from "@preact/preset-vite";

export default defineConfig({
  plugins: [preact(), tailwindcss({ optimize: false })],
  build: {
    outDir: "dist-readable",
    minify: false,
    cssMinify: false,
    sourcemap: true,
    rolldownOptions: {
      output: {
        minify: false,
        keepNames: true,
      },
    },
  },
});
