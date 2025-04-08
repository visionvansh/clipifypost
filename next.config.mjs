
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com", // Cloudinary ke liye
      },
      {
        protocol: "https",
        hostname: "www.powertrafic.fr", // Naya hostname jo error de raha hai
      },
    ],
  },
  };
  
  export default nextConfig;
  