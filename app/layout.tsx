import { Cinzel, EB_Garamond, Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

// Cinzel — Roman/stone-carving inspired display face. Used for every
// heading. Very stylized but unambiguously readable; the workshop-skill
// design brief calls for "stylized but super-readable" runic feel.
const fontDisplay = Cinzel({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
})

// EB Garamond — classic old-style serif for body copy. Period-feeling
// without sacrificing readability at small sizes.
const fontBody = EB_Garamond({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        fontDisplay.variable,
        fontBody.variable,
        "font-sans"
      )}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
