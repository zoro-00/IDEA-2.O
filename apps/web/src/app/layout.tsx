import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#020617",
};

export const metadata: Metadata = {
  title: "STAR — Spatial Temporal Automated Risk System | AI-Native AML Platform",
  description:
    "STAR is an AI-native financial intelligence platform for modern Anti-Money Laundering. Real-time detection powered by Isolation Forest (300 trees, 29 features), Graph Neural Networks, multi-hop tracing, and automated SAR generation.",
  keywords: [
    "AML",
    "Anti-Money Laundering",
    "Graph Intelligence",
    "Financial Crime",
    "AI Detection",
    "GNN",
    "Isolation Forest",
    "GraphSAGE",
    "Transaction Monitoring",
    "Neo4j",
    "Financial Crime Intelligence",
    "Suspicious Activity Report",
    "SAR Generation",
  ],
  openGraph: {
    title: "STAR — AI-Native Financial Crime Intelligence",
    description:
      "Follow the money. Isolation Forest anomaly detection, GNN investigation, and real-time graph intelligence for modern AML compliance.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@300;400;500;600;700&family=Syne:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased noise-bg">
        {children}
      </body>
    </html>
  );
}
