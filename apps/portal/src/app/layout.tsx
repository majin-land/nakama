import * as React from 'react'
import type { Metadata } from 'next'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import GlobalStyles from '@mui/material/GlobalStyles'

import theme from '@/theme'
import Nav from '@/components/nav'
import { Box } from '@mui/material'

export const metadata: Metadata = {
  title: 'Nakama',
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider options={{ enableCssLayer: false }}>
          <ThemeProvider theme={theme}>
            {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: '#f0f0f0',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  maxWidth: '90%',
                  margin: 'auto',
                  backgroundColor: '#fff',
                  height: '90vh',
                  width: '100%',
                  borderRadius: '10px',
                  padding: '20px 20px 20px 0',
                }}
              >
                <CssBaseline />
                <Nav />
                {props.children}
              </Box>
            </Box>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}
