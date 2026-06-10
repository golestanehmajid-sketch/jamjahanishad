import esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["server.ts"],
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: "dist/server.cjs",
  sourcemap: true,
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});
