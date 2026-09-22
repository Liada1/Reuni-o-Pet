import { defineConfig } from "vitest/config";

export default defineConfig({
  // Resolve o alias `@/` a partir do tsconfig, sem plugin.
  resolve: { tsconfigPaths: true },
  test: {
    include: ["src/**/*.test.ts"],
    // O grupo está em America/Fortaleza e a Vercel roda em UTC. Rodar os
    // testes em UTC é o que faz os erros de fuso aparecerem aqui em vez de
    // só em produção: na máquina do Adail, fuso do servidor e fuso do grupo
    // coincidem e escondem o problema.
    env: { TZ: "UTC" },
  },
});
