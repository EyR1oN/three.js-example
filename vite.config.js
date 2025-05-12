import { defineConfig } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    basicSsl({
      name: "test",
      domains: ["*.custom.com"],
      certDir: "/Users/.../.devServer/cert",
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        menu: resolve(__dirname, "index.html"),
        task1: resolve(__dirname, "index1.html"),
        task2: resolve(__dirname, "index2.html"),
        task3: resolve(__dirname, "index3.html"),
        task4: resolve(__dirname, "index4.html"),
      },
    },
  },
});
