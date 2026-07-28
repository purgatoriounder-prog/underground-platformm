import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Underground Techno Platform',
  description: 'Platform for underground techno music and sets',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
