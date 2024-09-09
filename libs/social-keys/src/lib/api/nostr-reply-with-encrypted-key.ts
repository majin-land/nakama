import { nostrReplyWithLitAction } from "../lit-actions-client"
import { fetchCachePrivateKey } from "../utils"
import { NostrReplyWithEncryptedKeyParams } from "../types"
import { getFirstSessionSig, getPkpAccessControlCondition } from "../utils"

/**
 * Replies with message information to users.
 *
 * This method fetches the encrypted key metadata from the service, then executes a Lit Action
 * to handle the decryption process within the action. It uses the provided parameters to
 * sign the message and return the finalized event from the Lit Action.
 *
 * @param {NostrReplyWithEncryptedKeyParams} params - Parameters required for signing the message,
 * including the Lit node client, PKP session signatures, and the key ID.
 * @returns {Promise<string>} A promise that resolves to the finalized event from the Lit Action.
 */

export async function nostrReplyWithEncryptedKey(
  params: NostrReplyWithEncryptedKeyParams,
): Promise<string> {
  const { litNodeClient, pkpSessionSigs, id } = params
  const sessionSig = getFirstSessionSig(pkpSessionSigs)

  const storedKeyMetadata = await fetchCachePrivateKey({
    id,
    sessionSig,
    litNetwork: litNodeClient.config.litNetwork,
  })

  const allowPkpAddressToDecrypt = getPkpAccessControlCondition(storedKeyMetadata.pkpAddress)

  return nostrReplyWithLitAction({
    ...params,
    storedKeyMetadata,
    accessControlConditions: [allowPkpAddressToDecrypt],
  })
}
