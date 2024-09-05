import React from 'react'
import { Box, Button, Divider, Card } from '@mui/material'
import ImportIcon from '@mui/icons-material/Input'
import Typography from '@mui/material/Typography'
import { useNDK } from '@/hooks/useNDK'

const Login: React.FC = () => {
  const { loginWithSecret } = useNDK()

  async function connect() {
    const res = await loginWithSecret(
      'nsec1gtpv739afe3afxxsgr8k6xf3p60hc5cez8zx3mh9ac72kc6eexlqlmafyg',
    )
    console.log(res)
  }

  return (
    <Box sx={styles.container}>
      <Card sx={styles.card}>
        <Typography variant="h4">NAKAMA</Typography>

        <Typography sx={styles.label}>Sign in to get started</Typography>

        <Divider sx={styles.divider} />

        <Button
          variant="contained"
          startIcon={<ImportIcon />}
          fullWidth
        >
          Import Nostr Account
        </Button>
      </Card>
    </Box>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
  },
  card: {
    width: 500,
    padding: '20px',
  },
  label: { mt: 2, mb: 4, color: '#aaa' },
  divider: { width: '100%', mb: 4, bgcolor: '#ebe7fb' },
}

export default Login
