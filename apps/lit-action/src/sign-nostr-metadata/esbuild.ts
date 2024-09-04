import * as esbuild from "https://deno.land/x/esbuild@v0.23.0/mod.js";
import { denoPlugins } from "https://deno.land/x/esbuild_deno_loader@0.8.5/mod.ts";

const go = async () => {
  let result = await esbuild.build({
    entryPoints: ["./src/sign-nostr-metadata/index.ts"],
    bundle: true,
    minify: true,
    sourcemap: false,
    outfile: "./dist/sign-nostr-metadata.js",
    sourceRoot: "./",
    platform: "node",
    metafile: true,
    external: ["ethers"],
    inject: ["./src/sign-nostr-metadata/esbuild-shims.ts"],
    plugins: denoPlugins(),
  });

  // Uncomment this if you want to analyze the metafile
  let text = await esbuild.analyzeMetafile(result.metafile);
  console.log(text);

  console.log("Build completed successfully");
};

go();
