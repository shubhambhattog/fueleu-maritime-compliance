export const siteConfig = {
  name: "FuelEU Maritime Compliance",
  description: "Manage routes, compliance balance, banking and pooling operations for maritime emissions",
  company: {
    name: "Varuna Marine Services B.V.",
    logo: "/VARUNA-MARINE-LOGO.png",
    favicon: "/VARUNA-MARINE-LOGO.ico",
  },
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
  },
  pages: {
    home: {
      title: "FuelEU Maritime Compliance",
      subtitle: "Manage routes, compare compliance balance, handle banking and pooling operations.",
    },
    dashboard: {
      title: "FuelEU Compliance Dashboard",
    },
  },
  logos: {
    navbar: {
      width: 56,
      height: 56,
      className: "rounded-full",
    },
    home: {
      width: 80,
      height: 80,
      className: "rounded-xl shadow-lg",
    },
  },
  links: {
    apiDocs: process.env.NEXT_PUBLIC_API_URL 
      ? `${process.env.NEXT_PUBLIC_API_URL}/routes`
      : "http://localhost:4000/routes",
  },
} as const;
