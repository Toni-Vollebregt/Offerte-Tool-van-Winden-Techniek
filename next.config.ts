import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse and pdfjs-dist must not be bundled — they need native Node.js runtime
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist'],
  // Allow SVG in public folder
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
