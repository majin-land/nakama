'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthMethodType } from '@lit-protocol/constants'

import { ORIGIN, registerWebAuthn, signInWithDiscord, signInWithGoogle } from '@/utils/lit'
import useAuthenticate from '@/hooks/useAuthenticate'
import useSession from '@/hooks/useSession'
import useAccounts from '@/hooks/useAccounts'
import SignupMethods from '@/components/signup-method'
import Loading from '@/components/loading'
import Main from '@/components/main'

export default function SignupView() {
  const redirectUri = ORIGIN

  const {
    authMethod,
    authWithWebAuthn,
    loading: authLoading,
    error: authError,
  } = useAuthenticate(redirectUri)
  const {
    createAccount,
    setCurrentAccount,
    currentAccount,
    loading: accountsLoading,
    error: accountsError,
  } = useAccounts()
  const { initSession, sessionSigs, loading: sessionLoading, error: sessionError } = useSession()
  const router = useRouter()

  const error = authError || accountsError || sessionError

  if (error) {
    if (authError) {
      console.error('Auth error:', authError)
    }

    if (accountsError) {
      console.error('Accounts error:', accountsError)
    }

    if (sessionError) {
      console.error('Session error:', sessionError)
    }
  }

  async function handleGoogleLogin() {
    await signInWithGoogle(redirectUri)
  }

  async function handleDiscordLogin() {
    await signInWithDiscord(redirectUri)
  }

  async function registerWithWebAuthn() {
    const newPKP = await registerWebAuthn()
    if (newPKP) {
      setCurrentAccount(newPKP)
    }
  }

  useEffect(() => {
    // If user is authenticated, create an account
    // For WebAuthn, the account creation is handled by the registerWithWebAuthn function
    if (authMethod && authMethod.authMethodType !== AuthMethodType.WebAuthn) {
      router.replace(window.location.pathname, undefined)
      createAccount(authMethod)
    }
  }, [authMethod, createAccount])

  useEffect(() => {
    // If user is authenticated and has at least one account, initialize session
    if (authMethod && currentAccount) {
      initSession(authMethod, currentAccount)
    }
  }, [authMethod, currentAccount, initSession])

  if (authLoading) {
    return (
      <Loading
        copy={'Authenticating your credentials...'}
        error={error}
      />
    )
  }

  if (accountsLoading) {
    return (
      <Loading
        copy={'Creating your account...'}
        error={error}
      />
    )
  }

  if (sessionLoading) {
    return (
      <Loading
        copy={'Securing your session...'}
        error={error}
      />
    )
  }

  if (currentAccount && sessionSigs) {
    return (
      // <Dashboard
      //   currentAccount={currentAccount}
      //   sessionSigs={sessionSigs}
      // />
      <Main />
    )
  } else {
    return (
      <SignupMethods
        handleGoogleLogin={handleGoogleLogin}
        handleDiscordLogin={handleDiscordLogin}
        registerWithWebAuthn={registerWithWebAuthn}
        authWithWebAuthn={authWithWebAuthn}
        goToLogin={() => router.push('/login')}
        error={error}
      />
    )
  }
}
