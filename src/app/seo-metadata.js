// SEO Metadata Component for Client-Side Pages (Legacy - kept for reference)
// Note: Meta tags are now set dynamically in page components using useEffect
export const LandingPageSEO = () => {
  return (
    <>
      <title>
        Zuha Hosts - Property Management System for Hospitality Teams
      </title>
      <meta
        name="description"
        content="All-in-one property management dashboard for hospitality teams. Manage bookings, properties, guests, and payments efficiently. Built for scale with real-time analytics and automation."
      />
      <meta
        name="keywords"
        content="property management, hospitality management, booking management, zuha hosts, vacation rental software, hotel management system, property management software, guest management, booking calendar, revenue management"
      />
      <meta name="author" content="Zuha Hosts Team" />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href="https://zuhahosts.com" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://zuhahosts.com" />
      <meta
        property="og:title"
        content="Zuha Hosts - Property Management System for Hospitality Teams"
      />
      <meta
        property="og:description"
        content="All-in-one property management dashboard for hospitality teams. Manage bookings, properties, guests, and payments efficiently."
      />
      <meta
        property="og:image"
        content="https://zuhahosts.com/og-image.jpg"
      />
      <meta property="og:site_name" content="Zuha Hosts" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@zuhahosts" />
      <meta name="twitter:creator" content="@zuhahosts" />
      <meta
        name="twitter:title"
        content="Zuha Hosts - Property Management System for Hospitality Teams"
      />
      <meta
        name="twitter:description"
        content="All-in-one property management dashboard for hospitality teams. Manage bookings, properties, guests, and payments efficiently."
      />
      <meta
        name="twitter:image"
        content="https://zuhahosts.com/og-image.jpg"
      />

      {/* Additional SEO tags */}
      <meta name="theme-color" content="#f43f5e" />
      <meta name="application-name" content="Zuha Hosts" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta
        name="apple-mobile-web-app-status-bar-style"
        content="black-translucent"
      />
      <meta name="apple-mobile-web-app-title" content="Zuha Hosts" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
    </>
  );
};

// Structured Data Schemas
export const getStructuredData = () => ({
  softwareApplication: {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Zuha Hosts",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free 14-day trial, no credit card required",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "1250",
      bestRating: "5",
      worstRating: "1",
    },
    description:
      "All-in-one property management dashboard for hospitality teams. Manage bookings, properties, guests, and payments efficiently.",
    featureList: [
      "Real-time Analytics",
      "Smart Scheduling",
      "Guest Management",
      "Payment Processing",
      "Task Management",
      "Role-based Access Control",
    ],
    screenshot: "https://zuhahosts.com/screenshot.jpg",
    softwareVersion: "2.0",
    author: {
      "@type": "Organization",
      name: "Zuha Hosts",
      url: "https://zuhahosts.com",
    },
  },

  organization: {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Zuha Hosts",
    url: "https://zuhahosts.com",
    logo: "https://zuhahosts.com/logo.png",
    sameAs: [
      "https://twitter.com/zuhahosts",
      "https://www.linkedin.com/company/zuhahosts",
      "https://github.com/zuhahosts",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Support",
      email: "support@zuhahosts.com",
      availableLanguage: ["English"],
    },
  },

  breadcrumb: {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://zuhahosts.com",
      },
    ],
  },
});

