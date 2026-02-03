import { CartProvider } from "@/contexts/cart-context";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <CartProvider>
            <Header />
            <main className="min-h-screen mx-auto max-w-7xl px-4">{children}</main>
            <Footer />
            <Toaster richColors position="top-center" />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}