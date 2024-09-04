import { Avatar, Box, IconButton, InputBase, Typography } from '@mui/material'
import React from 'react'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import SendIcon from '@mui/icons-material/Send'
import ChatItem from '../chat-list/chat-item'

const chatItms = [
  {
    key: 1,
    image:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcTA78Na63ws7B7EAWYgTr9BxhX_Z8oLa1nvOA&usqp=CAU',
    type: '',
    msg: 'Hi Tim, How are you?',
  },
  {
    key: 2,
    image:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcTA78Na63ws7B7EAWYgTr9BxhX_Z8oLa1nvOA&usqp=CAU',
    type: 'other',
    msg: 'I am fine.',
  },
  {
    key: 3,
    image:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcTA78Na63ws7B7EAWYgTr9BxhX_Z8oLa1nvOA&usqp=CAU',
    type: 'other',
    msg: 'What about you?',
  },
  {
    key: 4,
    image:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcTA78Na63ws7B7EAWYgTr9BxhX_Z8oLa1nvOA&usqp=CAU',
    type: '',
    msg: 'Awesome these days.',
  },
  {
    key: 5,
    image:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcTA78Na63ws7B7EAWYgTr9BxhX_Z8oLa1nvOA&usqp=CAU',
    type: 'other',
    msg: "Finally. What's the plan?",
  },
  {
    key: 6,
    image:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcTA78Na63ws7B7EAWYgTr9BxhX_Z8oLa1nvOA&usqp=CAU',
    type: '',
    msg: 'what plan mate?',
  },
  {
    key: 7,
    image:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcTA78Na63ws7B7EAWYgTr9BxhX_Z8oLa1nvOA&usqp=CAU',
    type: 'other',
    msg: "I'm taliking about the tutorial",
  },
]

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
      <Box sx={{ maxHeight: 'calc(100vh - calc(100vh / 2.5))', overflow: 'auto', height: '100%' }}>
        {chatItms.map((item, index) => (
          <ChatItem
            key={index}
            item={item}
          />
        ))}
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
