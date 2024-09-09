/**
 *
 * Get Nostr key
 *
 * @jsParam ciphertext - For the encrypted Wrapped Key
 * @jsParam dataToEncryptHash - For the encrypted Wrapped Key
 * @jsParam accessControlConditions - The access control condition that allows only the pkpAddress to decrypt the Wrapped Key
 *
 * @returns { Promise<string> } - Returns a message signed by the Ethers Wrapped key. Or returns errors if any.
 */

const LIT_PREFIX = 'lit_' as const

;(async () => {
  try {
    let decryptedPrivateKey
    try {
      decryptedPrivateKey = await Lit.Actions.decryptToSingleNode({
        accessControlConditions, // @JsParams accessControlConditions
        ciphertext, // @JsParams ciphertext
        dataToEncryptHash, // @JsParams dataToEncryptHash
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

    // Extract the nostr private key
    let nostrPrivateKey
    try {
      nostrPrivateKey = decryptedPrivateKey.slice(LIT_PREFIX.length).slice(2)
    } catch (err) {
      Lit.Actions.setResponse({ response: err.message })
      return
    }

    Lit.Actions.setResponse({ response: nostrPrivateKey })
  } catch (err) {
    const errorMessage = 'Error: When getting nostr key- ' + err.message
    Lit.Actions.setResponse({ response: errorMessage })
  }
})()
