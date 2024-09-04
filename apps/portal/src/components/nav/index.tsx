'use client'
import { Box, ListItemIcon, ListItemText, MenuItem, MenuList } from '@mui/material'
import ChatIcon from '@mui/icons-material/Chat'
import GroupsIcon from '@mui/icons-material/Groups'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import ExploreIcon from '@mui/icons-material/Explore'
import SettingsIcon from '@mui/icons-material/Settings'
import PersonIcon from '@mui/icons-material/Person'

export default function Nav() {
  return (
    <Box sx={styles.container}>
      <MenuList>
        <MenuItem>
          <ListItemIcon>
            <ChatIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Chats</ListItemText>
        </MenuItem>

        <MenuItem>
          <ListItemIcon>
            <GroupsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Groups</ListItemText>
        </MenuItem>

        <MenuItem>
          <ListItemIcon>
            <ExploreIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Update</ListItemText>
        </MenuItem>

        <MenuItem>
          <ListItemIcon>
            <AccountBalanceWalletIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Wallet</ListItemText>
        </MenuItem>
      </MenuList>

      <MenuList>
        <MenuItem>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>

        <MenuItem>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
      </MenuList>
    </Box>
  )
}

const styles = {
  container: {
    width: '200px',
    maxWidth: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'column',
    padding: '20px 5px 0',
  },
}
