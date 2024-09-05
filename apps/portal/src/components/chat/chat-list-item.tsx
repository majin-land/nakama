import { Avatar, Divider, List, ListItemAvatar, ListItemButton, ListItemText } from '@mui/material'
import React from 'react'

const ChatListItem = () => {
  return (
    <List>
      <ListItemButton>
        <ListItemAvatar>
          <Avatar>H</Avatar>
        </ListItemAvatar>
        <ListItemText
          primary="John Doe"
          secondary="Jan 9, 2014"
        />
      </ListItemButton>
      <Divider sx={{ borderColor: '#ebe7fb' }} />
    </List>
  )
}

export default ChatListItem
