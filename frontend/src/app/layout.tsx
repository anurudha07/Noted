import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "Noted",
  description: "Minimal note-taking app",
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="bg-black text-gray-200 text-sm min-h-screen">{children}
      </body>
    </html>
  );
}
