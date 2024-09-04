import { createContext, useState, ReactNode } from 'react'

interface NavContextProps {
  nav: string
  setNav: React.Dispatch<React.SetStateAction<string>>
}

const NavContext = createContext<NavContextProps>({
  nav: 'chats',
  setNav: () => '',
})

interface NavProviderProps {
  children: ReactNode
}

const NavProvider: React.FC<NavProviderProps> = ({ children }) => {
  const [nav, setNav] = useState<string>('chats')

  return <NavContext.Provider value={{ nav, setNav }}>{children}</NavContext.Provider>
}

export { NavContext, NavProvider }
