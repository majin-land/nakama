import { Box, IconButton, Typography } from '@mui/material'
import React from 'react'
import MoreVertIcon from '@mui/icons-material/MoreVert'

const Wallet = () => {
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Wallet</Typography>
        <IconButton>
          <MoreVertIcon />
        </IconButton>
      </Box>
    </>
  )
}

export default Wallet
