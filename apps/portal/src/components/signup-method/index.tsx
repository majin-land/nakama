'use client'

import { useState } from 'react'

import AuthMethods from './auth-method'
import WebAuthn from './webauthn'

import { SELECTED_LIT_NETWORK } from '@/utils/lit'

interface SignupProps {
  handleGoogleLogin: () => Promise<void>
  handleDiscordLogin: () => Promise<void>
  registerWithWebAuthn: any
  authWithWebAuthn: any
  goToLogin: any
  error?: Error
}

type AuthView = 'default' | 'webauthn'

export default function SignupMethods({
  handleGoogleLogin,
  handleDiscordLogin,
  registerWithWebAuthn,
  authWithWebAuthn,
  goToLogin,
  error,
}: SignupProps) {
  const [view, setView] = useState<AuthView>('default')

  return (
    <div className="container">
      <div className="wrapper">
        {error && (
          <div className="alert alert--error">
            <p>{error.message}</p>
          </div>
        )}
        {view === 'default' && (
          <>
            <h1>Get started on the {SELECTED_LIT_NETWORK} network</h1>
            <p>
              Create a wallet that is secured by accounts you already have. With Lit-powered
              programmable MPC wallets, you won&apos;t have to worry about seed phrases.
            </p>
            <AuthMethods
              handleGoogleLogin={handleGoogleLogin}
              handleDiscordLogin={handleDiscordLogin}
              setView={setView}
            />
            <div
              className="buttons-container"
              style={{ marginTop: '1rem' }}
            >
              <button
                type="button"
                className="btn btn--link"
                onClick={goToLogin}
              >
                Have an account? Log in
              </button>
            </div>
          </>
        )}
        {view === 'webauthn' && (
          <WebAuthn
            start={'register'}
            authWithWebAuthn={authWithWebAuthn}
            setView={setView}
            registerWithWebAuthn={registerWithWebAuthn}
          />
        )}
      </div>
    </div>
  )
}
