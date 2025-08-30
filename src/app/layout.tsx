import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Toaster } from '@/components/ui/sonner'
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});


export const metadata: Metadata = {
  title: 'MDX Playground AI',
  description: 'A powerful MDX editor with AI generation capabilities',
  keywords: ['MDX', 'Markdown', 'React', 'AI', 'Editor', 'Playground'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}