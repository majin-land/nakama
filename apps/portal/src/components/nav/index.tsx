'use client'
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Stack,
} from '@mui/material'
import ChatIcon from '@mui/icons-material/Chat'
import GroupsIcon from '@mui/icons-material/Groups'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import SettingsIcon from '@mui/icons-material/Settings'
import PersonIcon from '@mui/icons-material/Person'
import { useContext } from 'react'
import { NavContext } from '@/context/nav'

export default function Nav() {
  const { nav, setNav } = useContext(NavContext)

  const handleListItemClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    value: string,
  ) => {
    setNav(value)
  }
  return (
    <List
      sx={styles.container}
      subheader={
        <ListSubheader
          component="div"
          id="nested-list-subheader"
          sx={{ fontWeight: 'bold', fontSize: '24px' }}
        >
          Nakama
        </ListSubheader>
      }
    >
      <Stack
        justifyContent="space-between"
        direction="column"
        height="75vh"
      >
        <Box>
          <ListItemButton
            selected={nav === 'chats'}
            onClick={(event) => handleListItemClick(event, 'chats')}
          >
            <ListItemIcon>
              <ChatIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Chats</ListItemText>
          </ListItemButton>

          <ListItemButton
            selected={nav === 'groups'}
            onClick={(event) => handleListItemClick(event, 'groups')}
          >
            <ListItemIcon>
              <GroupsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Groups</ListItemText>
          </ListItemButton>

          <ListItemButton
            selected={nav === 'wallet'}
            onClick={(event) => handleListItemClick(event, 'wallet')}
          >
            <ListItemIcon>
              <AccountBalanceWalletIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Wallet</ListItemText>
          </ListItemButton>
        </Box>
        <Box>
          <ListItemButton>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Settings</ListItemText>
          </ListItemButton>

          <ListItemButton>
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Profile</ListItemText>
          </ListItemButton>
        </Box>
      </Stack>
    </List>
  )
}

const styles = {
  container: {
    width: '200px',
    maxWidth: '100%',
  },
}
