import { Avatar, Box, IconButton, InputBase, Typography } from '@mui/material'
import React from 'react'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import SendIcon from '@mui/icons-material/Send'

const ChatContent = () => {
  return (
    <Box
      sx={{
        flexGrow: 1,
        padding: '20px 40px',
        maxWidth: '100%',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '15px',
          borderBottom: '1px solid #ebe7fb',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar>H</Avatar>
          <Typography
            variant="h6"
            sx={{ marginLeft: '10px' }}
          >
            John Doe
          </Typography>
        </Box>
        <IconButton>
          <MoreVertIcon />
        </IconButton>
      </Box>
      <Box sx={{ maxHeight: 'calc(100vh - calc(100vh / 2))', overflow: 'auto', height: '100%' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
            marginBottom: '15px',
          }}
        >
          Test
        </Box>
      </Box>
      <Box sx={{ paddingTop: '30px' }}>
        <Box
          sx={{
            backgroundColor: '#fff',
            display: 'flex',
            justifyXontent: 'space-between',
            padding: '10px',
            borderRadius: '8px',
          }}
        >
          <InputBase
            sx={{ ml: 1, flex: 1 }}
            placeholder="Type a message here"
            size="small"
          />
          <IconButton
            color="primary"
            sx={{ p: '10px' }}
            aria-label="directions"
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  )
}

export default ChatContent
