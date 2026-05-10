import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  // Run pdf-parse and pdfjs-dist as native Node modules (not bundled by Turbopack)
  serverExternalPackages: ['pdfjs-dist'],
  // Allow SVG in public folder
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
