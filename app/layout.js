import './globals.css'
import { ThemeProvider } from '../contexts/ThemeContext'
import GoogleAdsense from '../components/GoogleAdsense'

export const metadata = {
  title: 'PlayLog',
  description: 'Track your gaming progress',
}

export default function RootLayout({ children }) {

  const pId = process.env.NEXT_PUBLIC_ADSENSE_PID
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <GoogleAdsense pId={pId}/>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

