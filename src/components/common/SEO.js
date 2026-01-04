import Head from "next/head";

export default function SEO({
  title,
  description,
  keywords,
  ogImage = "/og-image.jpg",
  ogType = "website",
  noIndex = false,
}) {
  const siteName = "Zuha Host";
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const defaultDescription =
    "Zuha Host - Modern property management platform for Airbnb hosts. Manage bookings, properties, guests, and earnings all in one place.";

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description || defaultDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description || defaultDescription} />
      <meta property="twitter:image" content={ogImage} />

      {/* Additional Meta Tags */}
      <meta name="theme-color" content="#0f172a" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content={siteName} />
    </Head>
  );
}

