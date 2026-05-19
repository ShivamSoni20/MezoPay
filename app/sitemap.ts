import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://mezosplit.app";

  const routes = [
    "",
    "/app/dashboard",
    "/app/send",
    "/app/request",
    "/app/split",
    "/app/earn",
    "/app/card",
    "/app/history",
    "/app/friends",
    "/app/settings",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "" ? 1.0 : 0.8,
  }));
}
