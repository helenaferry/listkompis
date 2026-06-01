import nextPwa from "next-pwa";

const withPWA = nextPwa({
  dest: "public",
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  reactStrictMode: true,
  turbopack: {}, // <- tystar Next 16 error
};

export default withPWA(nextConfig);
