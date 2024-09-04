import { Box } from '@mui/material'
import React, { useContext } from 'react'

import { NavContext } from '@/context/nav'

import ChatList from '../chat-list'
import ChatContent from '../chat-content'

function ChatBoddy() {
  const { nav } = useContext(NavContext)

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
      <Box sx={{ width: '100%', maxWidth: '350px' }}>{nav === 'chats' && <ChatList />}</Box>
      <ChatContent />
    </Box>
  )
}

export default ChatBoddy
