import { ExecuteJsResponse } from '@lit-protocol/types'
import { ClaimKeyParams } from './types'

export async function claimKey(params: ClaimKeyParams): Promise<ExecuteJsResponse | undefined> {
  const { litNodeClient, pkpSessionSigs, pkpPublicKey } = params

  const res  = await litNodeClient.executeJs({
    sessionSigs: pkpSessionSigs,
    code: `(async () => {
        Lit.Actions.claimKey({keyId: userId});
      })();`,
    jsParams: {
      userId: pkpPublicKey,
    },
  })

  if (!res.success && !res.claims) {
    throw new Error(`response should be success`)
  }

  if (
    res.claims === undefined ||
    res.claims === null ||
    Object.keys(res.claims).length === 0
  ) {
    throw new Error(`claimData should not be empty`)
  }

  return res
}
