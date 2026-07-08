import "./globals.css";

export const metadata = {
  title: "ProComm - Write with confidence. Send with certainty.",
  description: "Transform your messages into professional communications with AI.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <body className="min-h-screen bg-surface-secondary">{children}</body>
    </html>
  );
}
