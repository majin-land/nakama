'use client'
import { Box } from '@mui/material'
import React, { useContext } from 'react'
import Nav from '../nav'
import { NavContext, NavProvider } from '@/context/nav'
import ChatContent from '../chat/chat-content'
import Chat from '../chat'
import Groups from '../groups'
import Wallet from '../wallet'

const TabNav = () => {
  const { nav } = useContext(NavContext)

  return (
    <Box sx={styles.tabNav}>
      {nav === 'chats' && <Chat />}
      {nav === 'groups' && <Groups />}
      {nav === 'wallet' && <Wallet />}
    </Box>
  )
}

function Main() {
  return (
    <NavProvider>
      <Box sx={styles.container}>
        <Box sx={styles.wrapper}>
          <Nav />
          <Box sx={styles.content}>
            <TabNav />
            <ChatContent />
          </Box>
        </Box>
      </Box>
    </NavProvider>
  )
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f0f0f0',
  },
  wrapper: {
    display: 'flex',
    maxWidth: '90%',
    margin: 'auto',
    backgroundColor: '#fff',
    height: '90vh',
    width: '100%',
    borderRadius: '10px',
    padding: '20px 20px 20px 0',
  },
  tabNav: {
    width: '100%',
    maxWidth: '350px',
    borderRight: '1px solid #ebe7fb',
    height: '100%',
  },
  content: {
    flexGrow: 1,
    backgroundColor: '#f4f3f8',
    borderRadius: '10px',
    padding: '15px 20px',
    display: 'flex',
  },
}

export default Main
