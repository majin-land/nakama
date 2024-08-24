import { useCallback, useState } from 'react'
import { AuthMethod, IRelayPKP, SessionSigs } from '@lit-protocol/types'
import { LitAbility, LitActionResource } from '@lit-protocol/auth-helpers'

import { getSessionSigs } from '../utils/lit'

export default function useSession() {
  const [sessionSigs, setSessionSigs] = useState<SessionSigs>()
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error>()

  /**
   * Generate session sigs and store new session data
   */
  const initSession = useCallback(async (authMethod: AuthMethod, pkp: IRelayPKP): Promise<void> => {
    setLoading(true)
    setError(undefined)
    try {
      // Prepare session sigs params
      const chain = 'ethereum'
      const resourceAbilities = [
        {
          resource: new LitActionResource('*'),
          ability: LitAbility.PKPSigning,
        },
      ]
      const expiration = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString() // 1 week

      // Generate session sigs
      const sessionSigs = await getSessionSigs({
        pkpPublicKey: pkp.publicKey,
        authMethod,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-expect-error
        sessionSigsParams: {
          chain,
          expiration,
          resourceAbilityRequests: resourceAbilities,
        },
      })

      setSessionSigs(sessionSigs)
    } catch (err) {
      if (err instanceof Error) {
        setError(err)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    initSession,
    sessionSigs,
    loading,
    error,
  }
}
