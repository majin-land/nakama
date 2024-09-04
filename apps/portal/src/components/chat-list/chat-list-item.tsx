import { Avatar, Box, Typography } from '@mui/material'
import React from 'react'

const ChatListItem = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        borderBottom: '1px solid #ebe7fb',
        paddingBottom: '10px',
        marginTop: '10px',
        cursor: 'pointer',
        padding: '10px 10px 10px 20px',
      }}
    >
      <Avatar>H</Avatar>
      <Box sx={{ marginLeft: '10px' }}>
        <Typography
          sx={{ margin: 0, padding: 0, color: '#000', fontWeight: 600, fontSize: '14px' }}
        >
          John Doe
        </Typography>
        <Typography
          sx={{
            margin: 0,
            padding: 0,
            color: '#ceccd3',
            fontWeight: 400,
            fontSize: '12px',
            display: 'block',
          }}
        >
          10:00 AM
        </Typography>
      </Box>
    </Box>
  )
}

export default ChatListItem
