import { Box } from '@mui/material'
import React, { useContext } from 'react'

import { NavContext } from '@/context/nav'

import ChatList from '../chat-list'
import ChatContent from '../chat-content'
import Groups from '../groups'
import Wallet from '../wallet'

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
      <Box
        sx={{ width: '100%', maxWidth: '350px', borderRight: '1px solid #ebe7fb', height: '100%' }}
      >
        {nav === 'chats' && <ChatList />}
        {nav === 'groups' && <Groups />}
        {nav === 'wallet' && <Wallet />}
      </Box>
      <ChatContent />
    </Box>
  )
}

export default ChatBoddy
