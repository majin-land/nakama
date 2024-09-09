import { verifyEvent } from 'https://esm.sh/nostr-tools@2.7.2/pure'

/**
 *
 * Signs a message with the Ethers wallet which is also decrypted inside the Lit Action.
 *
 * @jsParam nostrEvent - nostr event message
 * @jsParam ciphertext - For the encrypted Wrapped Key
 * @jsParam dataToEncryptHash - For the encrypted Wrapped Key
 * @jsParam accessControlConditions - The access control condition that allows only the pkpAddress to decrypt the Wrapped Key
 *
 * @returns { Promise<string> } - Returns a message signed by the Ethers Wrapped key. Or returns errors if any.
 */
;(async () => {
  try {
    // Validate nostr request
    const isValid = verifyEvent(nostrEvent) // @JsParams nostrEvent
    if (!isValid) throw new Error('Invalid nostr request')

    const nostrPrivateKey = await Lit.Actions.call({
      ipfsId: 'QmZiLoNesqDbHia6cqZSi3b4k6vZSzwNdhCRhSQVQ5VYNU',
      params: {
        accessControlConditions, // @JsParams accessControlConditions
        ciphertext, // @JsParams ciphertext
        dataToEncryptHash, // @JsParams dataToEncryptHash
      },
    })
    if (!nostrPrivateKey) {
      // Exit the nodes which don't have the decryptedData
      return
    }

    const nostrReplyMessage =
      'Available commands : \ninfo: Key details for users.\nregister: Register a new wallet.\nsend: Send a transaction.\ntopup: Top up a wallet.\nvoucher: Get a voucher.\n'

    const encryptedMessage = await Lit.Actions.call({
      ipfsId: 'QmeX4NrSyZrB6aXPsMKM8huQuScDAvEnUrnZnYwRmdYX3U',
      params: {
        accessControlConditions, // @JsParams accessControlConditions
        ciphertext, // @JsParams ciphertext
        dataToEncryptHash, // @JsParams dataToEncryptHash
        pubkey: nostrEvent.pubkey,
        message: nostrReplyMessage,
      },
    })
    if (!encryptedMessage) {
      // Exit the nodes which don't have the decryptedData
      return
    }

    Lit.Actions.setResponse({ response: encryptedMessage })
  } catch (err) {
    const errorMessage = 'Error: When getting information feature - ' + err.message
    Lit.Actions.setResponse({ response: errorMessage })
  }
})()
