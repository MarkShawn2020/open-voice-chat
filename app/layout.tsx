import "styles/tailwind.css"

import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"

import { FloatingAudioControl } from "@/components/floating-audio-control"
import { Navbar } from "@/components/navbar"
import { Providers } from "@/components/providers"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: {
    default: "Open Voice Chat - Real-time AI Voice Conversations",
    template: "%s | Open Voice Chat",
  },
  description:
    "Open source real-time voice chat application powered by ByteDance Doubao AI. Experience natural voice conversations with customizable AI personas through an intuitive phone-like interface.",
  keywords: [
    "voice chat",
    "AI conversation",
    "real-time",
    "speech recognition",
    "text-to-speech",
    "ByteDance Doubao",
    "open source",
    "WebRTC",
    "voice assistant",
    "AI personas",
  ],
  authors: [
    {
      name: "Mark Shawn",
      url: "https://github.com/markshawn2020",
    },
  ],
  creator: "Mark Shawn",
  publisher: "Open Voice Chat Team",
  metadataBase: new URL("https://open-voice-chat.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://open-voice-chat.vercel.app",
    title: "Open Voice Chat - Real-time AI Voice Conversations",
    description:
      "Experience natural voice conversations with AI through our open source platform. Powered by ByteDance Doubao with customizable personas and phone-like interface.",
    siteName: "Open Voice Chat",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Open Voice Chat - Real-time AI Voice Conversations",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Open Voice Chat - Real-time AI Voice Conversations",
    description:
      "Open source voice chat platform with AI personas. Experience natural conversations powered by ByteDance Doubao.",
    images: ["/og-image.png"],
    creator: "@markshawn2020",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#000000",
      },
    ],
  },
  manifest: "/manifest.json",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body
        className={`
          min-h-screen font-sans antialiased selection:bg-blue-100 selection:text-blue-900
          ${inter.className}
        `}
        suppressHydrationWarning
      >
        <Providers>
          <Navbar />
          <div className="relative flex min-h-screen flex-col">
            {/* Global Loading Indicator */}
            <div id="global-loading" className="hidden fixed inset-0 z-50 bg-white/80 backdrop-blur-sm">
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
              </div>
            </div>
            
            {/* Main Content */}
            <main className="flex-1 relative">
              {children}
            </main>
            <FloatingAudioControl />
          </div>
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
