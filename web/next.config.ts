import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 镜像构建时启用 standalone 输出（见 web/Dockerfile 中的 DOCKER_BUILD=1）；
  // 本地 npm run build / start 流程不受影响。
  ...(process.env.DOCKER_BUILD === "1" ? { output: "standalone" as const } : {}),
};

export default nextConfig;
