import './globals.css';
import { Inter } from 'next/font/google';
import { ReactNode } from 'react';
// import Navbar from '@/components/Navbar';
// import Footer from '@/components/Footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata = {
  title: 'UE Connect Admin',
  description: 'UE Connect Admin',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-inter">
        {/* <Navbar /> */}
        <main>{children}</main>
        {/* <Footer /> */}
      </body>
    </html>
  );
}
