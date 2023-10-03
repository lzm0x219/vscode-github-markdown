import path from "node:path";
import webpack, { type Configuration } from "webpack";

type Env = {
  mode: "development" | "production" | "none";
};

export default async function (env: Env): Promise<Configuration[]> {
  const mode = env.mode || "none";
  const isProd = mode === "production";
  return [
    {
      mode,
      target: "node",
      entry: {
        extension: "./src/extension.ts",
      },
      output: {
        filename: "[name].js",
        path: path.join(__dirname, "./dist"),
        libraryTarget: "commonjs2",
        devtoolModuleFilenameTemplate: "../../[resource-path]",
        clean: true,
      },
      resolve: {
        mainFields: ["module", "main"], // look for `browser` entry point in imported node modules
        extensions: [".ts", ".js"], // support ts-files and js-files
        alias: {
          // provides alternate implementation for node module and source files
        },
      },
      module: {
        rules: [
          {
            test: /\.ts$/,
            include: path.join(__dirname, "src"),
            exclude: /node_modules/,
            use: [
              {
                loader: "ts-loader",
                options: {
                  configFile: path.join(__dirname, "tsconfig.json"),
                  experimentalWatchApi: true,
                  transpileOnly: true,
                },
              },
            ],
          },
        ],
      },
      plugins: [
        new webpack.optimize.LimitChunkCountPlugin({
          maxChunks: 1, // disable chunks by default since web extensions must be a single bundle
        }),
      ],
      externals: {
        vscode: "commonjs vscode", // ignored because it doesn't exist
      },
      performance: {
        hints: false,
      },
      devtool: isProd ? false : "nosources-source-map", // create a source map that points to the original source file
      infrastructureLogging: isProd
        ? undefined
        : {
            level: "log", // enables logging required for problem matchers
          },
      stats: {
        preset: "errors-warnings",
        assets: true,
        assetsSort: "name",
        assetsSpace: 100,
        colors: true,
        env: true,
        errorsCount: true,
        warningsCount: true,
        timings: true,
      },
    },
    {
      mode,
      target: "webworker",
      entry: {
        "extension.web": "./src/extension.ts",
      },
      output: {
        filename: "[name].js",
        path: path.join(__dirname, "./dist"),
        libraryTarget: "commonjs2",
        devtoolModuleFilenameTemplate: "../../[resource-path]",
        clean: true,
      },
      resolve: {
        mainFields: ["browser", "module", "main"], // look for `browser` entry point in imported node modules
        extensions: [".ts", ".js"], // support ts-files and js-files
        alias: {
          // provides alternate implementation for node module and source files
        },
        fallback: {
          //
        },
      },
      module: {
        rules: [
          {
            test: /\.ts$/,
            exclude: /node_modules/,
            use: [
              {
                loader: "ts-loader",
                options: {
                  configFile: path.join(__dirname, "tsconfig.web.json"),
                  experimentalWatchApi: true,
                  transpileOnly: true,
                },
              },
            ],
          },
        ],
      },
      plugins: [
        new webpack.optimize.LimitChunkCountPlugin({
          maxChunks: 1, // disable chunks by default since web extensions must be a single bundle
        }),
        new webpack.ProvidePlugin({
          process: "process/browser", // provide a shim for the global `process` variable
        }),
      ],
      externals: {
        vscode: "commonjs vscode", // ignored because it doesn't exist
      },
      performance: {
        hints: false,
      },
      devtool: isProd ? false : "nosources-source-map", // create a source map that points to the original source file
      infrastructureLogging: isProd
        ? undefined
        : {
            level: "log", // enables logging required for problem matchers
          },
      stats: {
        preset: "errors-warnings",
        assets: true,
        assetsSort: "name",
        assetsSpace: 100,
        colors: true,
        env: true,
        errorsCount: true,
        warningsCount: true,
        timings: true,
      },
    },
  ];
}
