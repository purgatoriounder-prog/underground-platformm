/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
};

module.exports = nextConfig;
export default function Home() {
  return <h1>Underground Techno</h1>;
}
rm -rf .next
npm install
npm run build
