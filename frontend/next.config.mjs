const requiredPublicEnv = [
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
];

const missingPublicEnv = requiredPublicEnv.filter((key) => !process.env[key]);
const cloudinaryCloudName =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dzzflhq79';

if (missingPublicEnv.length > 0) {
  const message = `Missing required frontend env: ${missingPublicEnv.join(', ')}`;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(message);
  }

  console.warn(message);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: `/${cloudinaryCloudName}/**`,
      },
    ],
  },
};

export default nextConfig;
