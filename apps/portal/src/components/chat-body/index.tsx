import { Box } from '@mui/material'
import React from 'react'
import ChatList from '../chat-list'
import ChatContent from '../chat-content'

function ChatBoddy() {
  return (
    <Box
      sx={{
        flexGrow: 1,
        backgroundColor: '#f4f3f8',
        borderRadius: '10px',
        padding: '15px 20px',
        display: 'flex',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: '350px' }}>
        <ChatList />
      </Box>
      <ChatContent />
    </Box>
  )
}

export default ChatBoddy
