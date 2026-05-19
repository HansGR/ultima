const config = require('@ff6wc/next-config')
/** @type {import('next').NextConfig} */

module.exports = {
  ...config,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};
