import { sendCryptoWithLitAction } from '../lit-actions-client'
import { fetchPrivateKey } from '../service-client'
import { SendCryptoWithEncryptedKeyParams } from '../types'
import { getFirstSessionSig, getPkpAccessControlCondition } from '../utils'

/**
 * Replies with message information to users.
 *
 * This method fetches the encrypted key metadata from the service, then executes a Lit Action
 * to handle the decryption process within the action. It uses the provided parameters to
 * sign the message and return the finalized event from the Lit Action.
 *
 * @param {SendCryptoWithEncryptedKeyParams} params - Parameters required for signing the message,
 * including the Lit node client, PKP session signatures, and the key ID.
 * @returns {Promise<string>} A promise that resolves to the finalized event from the Lit Action.
 */

export async function sendCryptoWithEncryptedKey(
  params: SendCryptoWithEncryptedKeyParams,
): Promise<string> {
  const { litNodeClient, pkpSessionSigs, id } = params
  const sessionSig = getFirstSessionSig(pkpSessionSigs)

  const storedKeyMetadata = await fetchPrivateKey({
    id,
    sessionSig,
    litNetwork: litNodeClient.config.litNetwork,
  })

  const allowPkpAddressToDecrypt = getPkpAccessControlCondition(storedKeyMetadata.pkpAddress)

  return sendCryptoWithLitAction({
    ...params,
    storedKeyMetadata,
    accessControlConditions: [allowPkpAddressToDecrypt],
  })
}
