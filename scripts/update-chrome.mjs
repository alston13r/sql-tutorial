import fs from "fs";
import { globSync } from "glob";

const navRegex =
  /<nav class="navbar navbar-expand-lg navbar-dark bg-primary">[\s\S]*?<\/nav>/;

const footerRegex =
  /<footer class="bg-light py-3 mt-auto border-top">[\s\S]*?<\/footer>/;

const contextByFile = [
  { pattern: "index.html", context: "home" },
  { pattern: "index-path.html", context: "path" },
  { pattern: "pages/practice.html", context: "practice" },
  { pattern: "pages/profile.html", context: "profile" },
];

function getContext(file) {
  const match = contextByFile.find((entry) => file.replace(/\\/g, "/").endsWith(entry.pattern));
  return match?.context || "module";
}

for (const file of globSync(["index.html", "index-path.html", "modules/*.html", "pages/*.html"])) {
  let content = fs.readFileSync(file, "utf8");
  const context = getContext(file);
  let changed = false;

  if (navRegex.test(content)) {
    content = content.replace(
      navRegex,
      `<div id="site-nav" data-nav-context="${context}"></div>`,
    );
    changed = true;
  }

  if (footerRegex.test(content)) {
    content = content.replace(footerRegex, `<div id="site-footer"></div>`);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log("updated chrome in", file);
  }
}
