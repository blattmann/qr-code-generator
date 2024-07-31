const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    proxy: {
      "/generate": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
    watchFiles: ["src/**/*", "public/**/*"],
    hot: true, // Re-enable HMR
    liveReload: false, // Disable live reload to prevent full page reloads
  },
});
