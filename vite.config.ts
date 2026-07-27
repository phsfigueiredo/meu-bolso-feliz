import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// GitHub Pages hospeda em https://<user>.github.io/<repo>/ → precisa do base
// setado com o nome do repo em prod. Em dev, mantém "/" para o Vite normal.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/meu-bolso-feliz/" : "/",

  server: {
    host: "::",
    port: 8080,
  },

  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
