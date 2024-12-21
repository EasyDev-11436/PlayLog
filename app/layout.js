import './globals.css'
import { ThemeProvider } from '../contexts/ThemeContext'
import GoogleAdsense from '../components/GoogleAdsense'
import { NotificationProvider } from '../contexts/NotificationContext'
import Toast from '../components/Toast'

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
          <NotificationProvider>
            {children}
            <Toast />
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}


