/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'uploadthing.com' },
      { protocol: 'https', hostname: 'utfs.io' },
      { protocol: 'https', hostname: 'subdomain' },
      { protocol: 'https', hostname: 'files.stripe.com' },
    ],
  },
  reactStrictMode: false,
  typescript: {
    // Allow production builds to succeed even if there are TypeScript errors.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Allow production builds to succeed even if there are ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Turbopack configuration
  turbopack: {
    // Ignore .md files (like @uploadthing/mime-types/README.md) so they
    // aren't treated as executable modules under Turbopack.
    rules: {
      '**/*.md': {
        loaders: [],
        as: '*.js',
      },
    },
  },
  webpack: (config) => {
    // Allow importing README and other .md files (e.g. from @uploadthing/mime-types)
    // without treating them as code modules.
    config.module.rules.push({
      test: /\.md$/,
      type: 'asset/source',
    });

    return config;
  },
};

export default nextConfig;
