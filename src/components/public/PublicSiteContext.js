"use client";

import { createContext, useContext } from "react";

const PublicSiteContext = createContext(null);

export function PublicSiteProvider({ value, children }) {
  return (
    <PublicSiteContext.Provider value={value}>
      {children}
    </PublicSiteContext.Provider>
  );
}

export function usePublicSite() {
  const ctx = useContext(PublicSiteContext);
  return ctx;
}
