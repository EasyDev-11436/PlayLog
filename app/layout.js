import './globals.css'
import { ThemeProvider } from '../components/theme-provider'

export const metadata = {
  title: 'PlayLog',
  description: 'Track your gaming progress',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

