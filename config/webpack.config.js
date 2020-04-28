const webpack = require("webpack");
const path = require("path");
const BabiliPlugin = require("babili-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");

module.exports = {
  entry: path.resolve(__dirname, "../index.js"),
  output: {
    path: path.resolve(__dirname, "../build"),
    filename: "mathsteps.min.js",
    libraryTarget: "umd",
    library: "mathsteps"
  },
  externals: {
    mathjs: "mathjs"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [/node_modules/, /scripts/, /test/, /Config/],
        use: ["babel-loader"]
      }
    ]
  },
  plugins: [
    new webpack.LoaderOptionsPlugin({ // Options for loader that will run on files
      minimize: true,
      debug: false,
      options: {
        context: __dirname
      }
    }),
    new webpack.optimize.ModuleConcatenationPlugin(), // Webpack 3 (scope hoisting)
    new webpack.optimize.UglifyJsPlugin(), // Minifier
    new webpack.DefinePlugin({ // Production ready build
      "process.env": {
        NODE_ENV: JSON.stringify("production")
      }
    }),
    new CleanWebpackPlugin([path.resolve(__dirname, "../build")]) // Prebuild (kinda hook)
  ]
};