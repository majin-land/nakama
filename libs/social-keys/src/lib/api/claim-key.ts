import { ExecuteJsResponse } from '@lit-protocol/types';
import { ClaimKeyParams } from '../types'

export async function claimKey(
  params: ClaimKeyParams,
): Promise<ExecuteJsResponse>{
  const { litNodeClient, pkpSessionSigs, pkpPublicKey } = params

  const res = await litNodeClient.executeJs({
    sessionSigs: pkpSessionSigs,
    code: `(async () => {
        Lit.Actions.claimKey({keyId: userId});
      })();`,
    jsParams: {
      userId: pkpPublicKey
    },
  });

  if (!res.success && !res.claims) {
    console.error(`response should be success`);
  }

  if (
    res.claims === undefined ||
    res.claims === null ||
    Object.keys(res.claims).length === 0
  ) {
    console.error(`claimData should not be empty`);
  }

  return res
}
