import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["edu-sdk", "@edu-sdk/react"],
};

export default nextConfig;
