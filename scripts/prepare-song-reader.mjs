import {
  mkdir,
  copyFile,
  readdir,
  readFile,
  writeFile,
  rm,
} from "node:fs/promises";
const target = new URL("../public/song-reader/", import.meta.url);
// This directory contains only generated assets. Serve compressed bytes as .bin:
// serving .gz can make the browser decode them before Kuromoji's own decoder.
await rm(target, { recursive: true, force: true });
await mkdir(new URL("dict/", target), { recursive: true });
const source = await readFile(
  new URL("../node_modules/kuromoji/build/kuromoji.js", import.meta.url),
  "utf8",
);
await writeFile(
  new URL("kuromoji.js", target),
  source.replaceAll(".dat.gz", ".dat.bin"),
);
for (const file of await readdir(
  new URL("../node_modules/kuromoji/dict/", import.meta.url),
)) {
  await copyFile(
    new URL(`../node_modules/kuromoji/dict/${file}`, import.meta.url),
    new URL(`dict/${file.replace(/\.gz$/, ".bin")}`, target),
  );
}
await copyFile(
  new URL("../node_modules/kuromoji/LICENSE-2.0.txt", import.meta.url),
  new URL("LICENSE.txt", target),
);
await copyFile(
  new URL("../node_modules/kuromoji/NOTICE.md", import.meta.url),
  new URL("NOTICE.md", target),
);
