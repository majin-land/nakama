import * as React from 'react'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'

import SignupView from '@/components/signup-view'

export default function Home() {
  return (
    <Container maxWidth="lg">
      <Typography
        variant="h1"
        mb={2}
      >
        Nakama
      </Typography>
      <SignupView />
    </Container>
  )
}
