import './globals.css'

export const metadata = {
  title: 'Audio Extractor',
  description: 'Extract audio from video using ffmpeg',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}

