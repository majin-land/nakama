import { Box, IconButton, InputBase, Typography } from '@mui/material'
import React from 'react'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import SearchIcon from '@mui/icons-material/Search'
import ChatListItem from './chat-list-item'

const ChatList = () => {
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Chats</Typography>
        <IconButton>
          <MoreVertIcon />
        </IconButton>
      </Box>
      <Box
        sx={{
          backgroundColor: '#fff',
          display: 'flex',
          justifyXontent: 'space-between',
          padding: '10px',
          marginRight: '10px',
          marginTop: '10px',
          borderRadius: '8px',
        }}
      >
        <InputBase
          sx={{ ml: 1, flex: 1 }}
          placeholder="Search here"
          size="small"
        />
        <SearchIcon />
      </Box>
      <Box sx={{ marginTop: '15px', overflow: 'auto', maxHeight: 'calc(100vh - calc(100vh / 2))' }}>
        <ChatListItem />
      </Box>
    </>
  )
}

export default ChatList
