import { defineConfig } from "vite";
import { resolve, relative } from "path";
import { globSync } from "glob";

const htmlInputs = Object.fromEntries(
  globSync("{index,index-path,modules/*.html,pages/*.html}").map((file) => [
    relative(".", file)
      .replace(/\.html$/, "")
      .replace(/[\\/]/g, "-"),
    resolve(file),
  ]),
);

export default defineConfig({
  base: "/sql-tutorial/",
  build: {
    rollupOptions: { input: htmlInputs },
  },
});
