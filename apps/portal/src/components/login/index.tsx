import React from 'react'
import { Box, Button, Typography, Divider, Card } from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import ImportIcon from '@mui/icons-material/Input'

const Login: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      <Card sx={{ width: 500, padding: '20px' }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 'bold' }}
        >
          NAKAMA
        </Typography>

        {/* Sign-in message */}
        <Typography sx={{ mt: 2, mb: 4, color: '#aaa' }}>Sign in to get started</Typography>

        <Divider sx={{ width: '100%', mb: 4, bgcolor: '#ebe7fb' }} />

        {/* Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<AutoAwesomeIcon />}
            fullWidth
          >
            Create Nostr Account
          </Button>
          <Button
            variant="contained"
            startIcon={<ImportIcon />}
            fullWidth
          >
            Import Nostr Account
          </Button>
        </Box>
      </Card>
    </Box>
  )
}

export default Login
