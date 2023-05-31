/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack(config) {
    config.externals = config.externals || [];
    config.externals.push({
      "cohere-ai": "cohere-ai",
      chromadb: "chromadb",
      "hnswlib-node": "hnswlib-node",
      "html-to-text": "html-to-text",
      mammoth: "mammoth",
      mongodb: "mongodb",
      "pdf-parse": "pdf-parse",
      playwright: "playwright",
      puppeteer: "puppeteer",
      redis: "redis",
      replicate: "replicate",
      "srt-parser-2": "srt-parser-2",
      typeorm: "typeorm",
    });
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
};

module.exports = nextConfig;
