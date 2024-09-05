import { Avatar, Box, Typography } from '@mui/material'
import React from 'react'

const ChatItem = ({ item }: { item: any }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        marginBottom: '15px',
        transformOrigin: 'right',
        ...(item.type === 'other' && {
          flexDirection: 'row-reverse',
          transformOrigin: 'left',
        }),
      }}
    >
      <Box
        sx={{
          backgroundColor: '#4462ff',
          color: '#fff',
          padding: '15px',
          borderRadius: '10px 10px 0 10px',
          maxWidth: '50%',
          minWidth: '215px',
          ...(item.type === 'other' && {
            backgroundColor: '#fff',
            color: '#000 !important',
            borderRadius: '10px 10px 10px 0',
            maxWidth: '50%',
          }),
        }}
      >
        <Typography variant="subtitle2">{item.msg}</Typography>
        <Box sx={{ justifyContent: 'space-between', display: 'flex', marginTop: '10px' }}>
          <Typography
            variant="caption"
            sx={{ color: '#8693d3' }}
          >
            16 mins ago
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: '#8693d3' }}
          >
            Seen 1.03PM
          </Typography>
        </Box>
      </Box>
      <Avatar
        sx={{
          marginLeft: '20px',
          ...(item.type === 'other' && { marginRight: '20px', marginLeft: '0px' }),
        }}
      >
        H
      </Avatar>
    </Box>
  )
}

export default ChatItem
