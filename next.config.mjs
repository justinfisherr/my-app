/** @type {import('next').NextConfig} */

const isProd = (process.env.NODE_ENV = "production");

const nextConfig = {
  basePath: isProd ? "/my-app" : "",
};

export default nextConfig;
