import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    // Proxy API calls to Express so you never hit CORS issues in dev
    proxy: {
      "/api": {
        target: "http://localhost:6000",
        changeOrigin: true,
      },
    },
  },
});
