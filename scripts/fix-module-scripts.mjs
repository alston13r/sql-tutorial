import fs from "fs";
import { globSync } from "glob";

const lessonOld = `  <script src="../js/sql-runner.js"></script>
  <script src="../js/exercise.js"></script>
  <script type="module" src="../js/progress.js"></script>
  <script src="../js/lesson-page.js"></script>
  <script type="module" src="../js/auth-ui.js"></script>`;

const lessonNew =
  '  <script type="module" src="../js/entries/lesson.js"></script>';

for (const file of globSync("modules/*.html")) {
  if (file.endsWith("14-security.html")) continue;
  let content = fs.readFileSync(file, "utf8");
  if (!content.includes("sql-runner.js")) continue;
  const normalized = content.replace(/\r\n/g, "\n");
  if (!normalized.includes(lessonOld)) {
    console.warn("pattern not found in", file);
    continue;
  }
  const updated = normalized.replace(lessonOld, lessonNew);
  fs.writeFileSync(file, updated.replace(/\n/g, "\r\n"));
  console.log("updated", file);
}
