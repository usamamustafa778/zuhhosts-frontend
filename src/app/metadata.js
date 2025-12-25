// SEO Metadata configuration
export const siteConfig = {
  name: "Zuha Hosts",
  title: "Zuha Hosts - Property Management System for Hospitality Teams",
  description:
    "All-in-one property management dashboard for hospitality teams. Manage bookings, properties, guests, and payments efficiently. Built for scale with real-time analytics and automation.",
  url: "https://zuhahosts.com",
  ogImage: "https://zuhahosts.com/og-image.jpg",
  keywords: [
    "property management",
    "hospitality management",
    "booking management",
    "zuha hosts",
    "vacation rental software",
    "hotel management system",
    "property management software",
    "guest management",
    "booking calendar",
    "revenue management",
    "hospitality operations",
    "saas dashboard",
  ],
  authors: [{ name: "Zuha Hosts Team" }],
  creator: "Zuha Hosts",
  publisher: "Zuha Hosts",
};

export const generateMetadata = (page = {}) => {
  const title = page.title
    ? `${page.title} | ${siteConfig.name}`
    : siteConfig.title;
  const description = page.description || siteConfig.description;
  const url = page.url ? `${siteConfig.url}${page.url}` : siteConfig.url;
  const ogImage = page.ogImage || siteConfig.ogImage;

  return {
    title,
    description,
    keywords: siteConfig.keywords.join(", "),
    authors: siteConfig.authors,
    creator: siteConfig.creator,
    publisher: siteConfig.publisher,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      title,
      description,
      siteName: siteConfig.name,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
      creator: "@zuhahosts",
      site: "@zuhahosts",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon.ico",
      apple: "/apple-touch-icon.png",
    },
    manifest: "/site.webmanifest",
  };
};

