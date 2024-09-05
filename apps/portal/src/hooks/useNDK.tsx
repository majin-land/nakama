'use client'
import React from 'react'
import NDK, { Hexpubkey, NDKPrivateKeySigner, NDKUser, NDKUserProfile } from '@nostr-dev-kit/ndk'

// Find relays at https://nostr.watch
const defaultRelays = ['wss://lunchbox.sandwich.farm']

// Define the data that will be returned by useNDK();
type NDKContextType = {
  ndk: NDK
  loginWithSecret: (
    skOrNsec: string,
  ) => Promise<{ user: NDKUser; npub: Hexpubkey; sk: string; signer: any } | undefined>
  getUser: (npub: string) => Promise<NDKUserProfile | undefined>
}

// define this outside of the below NDKProvider component so that it is in scope for useNDK()
let NDKContext: React.Context<NDKContextType>

export const NDKProvider = ({ children }: { children: React.ReactNode }) => {
  // create a new NDK instance to be used throughout the app
  const ndkLocal = new NDK({ explicitRelayUrls: defaultRelays })

  // use a ref to keep the NDK instance in scope for the lifetime of the component
  const ndk = React.useRef(ndkLocal)

  // Normally ndk.connect should be called asynchrounously, but in this case the instance will connect to the relays soon after the app loads
  ndk.current
    .connect() // connect to the NDK
    .then(() => console.log('Connected to NDK')) // log success
    .catch(() => console.log('Failed to connect to NDK')) // log failure

  const loginWithSecret = (skOrNsec: string) => {
    const privkey = skOrNsec

    const signer = new NDKPrivateKeySigner(privkey)
    return signer.user().then(async (user) => {
      if (user.npub) {
        return {
          user: user,
          npub: user.npub,
          sk: privkey,
          signer: signer,
        }
      }
    })
  }

  const getUser = async (npub: string) => {
    const user = ndk.current.getUser({
      npub,
    })
    await user.fetchProfile()

    const userProfile = user.profile
    return userProfile
  }

  // Define what will be returned by useNDK();
  const contextValue = {
    ndk: ndk.current,
    loginWithSecret,
    getUser,
  }

  // create a new context with the contextValue
  NDKContext = React.createContext(contextValue)

  // Return our new provider with `children` as components that will be wrapped by the provider
  return <NDKContext.Provider value={contextValue}>{children}</NDKContext.Provider>
}

// This is the hook that will be used in other components to access the NDK instance
export const useNDK = () => React.useContext(NDKContext)
