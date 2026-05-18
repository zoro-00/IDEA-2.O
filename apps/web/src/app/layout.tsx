import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "STAR — Spatial Temporal Automated Risk System",
  description:
    "AI-native graph intelligence platform for modern Anti-Money Laundering. Real-time financial crime detection powered by Graph Neural Networks, AI investigation copilot, and automated SAR generation.",
  keywords: [
    "AML",
    "Anti-Money Laundering",
    "Graph Intelligence",
    "Financial Crime",
    "AI Detection",
    "GNN",
    "Transaction Monitoring",
  ],
  openGraph: {
    title: "STAR — AI-Native Financial Intelligence",
    description: "See what legacy AML systems miss. Graph-native intelligence for modern financial crime detection.",
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
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
