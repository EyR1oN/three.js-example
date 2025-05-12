// vite.config.js
import basicSsl from "@vitejs/plugin-basic-ssl";

export default {
  plugins: [
    basicSsl({
      /** name of certification */
      name: "test",
      /** custom trust domains */
      domains: ["*.custom.com"],
      /** custom certification directory */
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
};
