'use client'
import { Box } from '@mui/material'
import React from 'react'
import Nav from '../nav'
import { NavProvider } from '@/context/nav'
import ChatBoddy from '../chat-body'

function Main() {
  return (
    <NavProvider>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#f0f0f0',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            maxWidth: '90%',
            margin: 'auto',
            backgroundColor: '#fff',
            height: '90vh',
            width: '100%',
            borderRadius: '10px',
            padding: '20px 20px 20px 0',
          }}
        >
          <Nav />
          <ChatBoddy />
        </Box>
      </Box>
    </NavProvider>
  )
}

export default Main
