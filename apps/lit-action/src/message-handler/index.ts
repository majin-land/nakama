import { finalizeEvent } from 'https://esm.sh/nostr-tools@2.7.2/pure'
import { decrypt as nip04Decrypt } from 'https://esm.sh/nostr-tools@2.7.2/nip04.js'
const { removeSaltFromDecryptedKey } = require('../utils.js')

/**
 *
 * Signs a message with the Ethers wallet which is also decrypted inside the Lit Action.
 *
 * @jsParam pkpAddress - The Eth address of the PKP which is associated with the Wrapped Key
 * @jsParam ciphertext - For the encrypted Wrapped Key
 * @jsParam dataToEncryptHash - For the encrypted Wrapped Key
 * @jsParam unsignedMetadata - The unsigned metadata to be signed by the Wrapped Key
 * @jsParam accessControlConditions - The access control condition that allows only the pkpAddress to decrypt the Wrapped Key
 *
 * @returns { Promise<string> } - Returns a message signed by the Ethers Wrapped key. Or returns errors if any.
 */

;(async () => {
  let decryptedPrivateKey
  try {
    decryptedPrivateKey = await Lit.Actions.decryptToSingleNode({
      accessControlConditions,
      ciphertext,
      dataToEncryptHash,
      chain: 'ethereum',
      authSig: null,
    })
  } catch (err) {
    const errorMessage = 'Error: When decrypting to a single node- ' + err.message
    Lit.Actions.setResponse({ response: errorMessage })
    return
  }

  if (!decryptedPrivateKey) {
    // Exit the nodes which don't have the decryptedData
    return
  }

  let privateKey
  try {
    privateKey = removeSaltFromDecryptedKey(decryptedPrivateKey)
  } catch (err) {
    Lit.Actions.setResponse({ response: err.message })
    return
  }

  // Decrypt the content of the nostr request
  const payload = await nip04Decrypt(
    ethers.utils.arrayify(privateKey),
    nostrEvent.pubkey,
    nostrEvent.content,
  )
  console.info('Received DM:', payload)

  try {
    const response = payload
    Lit.Actions.setResponse({ response: JSON.stringify(response) })
  } catch (err) {
    const errorMessage = 'Error: When signing message- ' + err.message
    Lit.Actions.setResponse({ response: errorMessage })
  }
})()
