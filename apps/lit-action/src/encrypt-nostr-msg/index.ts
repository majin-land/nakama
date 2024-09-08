import { EncryptedDirectMessage } from 'https://esm.sh/nostr-tools/kinds'
import { finalizeEvent } from 'https://esm.sh/nostr-tools@2.7.2/pure'
import { encrypt as nip04Encrypt } from 'https://esm.sh/nostr-tools@2.7.2/nip04.js'

/**
 *
 * Encrypt message with nostr key
 *
 * @jsParam ciphertext - For the encrypted Wrapped Key
 * @jsParam dataToEncryptHash - For the encrypted Wrapped Key
 * @jsParam accessControlConditions - The access control condition that allows only the pkpAddress to decrypt the Wrapped Key
 * @jsParam pubkey - pubkey to send the messsage
 * @jsParam message - message to encrypt to nostr
 *
 * @returns { Promise<string> } - Returns a message signed by the Ethers Wrapped key. Or returns errors if any.
 */
;(async () => {
  try {
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

    const nostrMessage = {
      kind: EncryptedDirectMessage,
      tags: [['p', pubkey]], // @JsParams pubkey
      created_at: Math.floor(Date.now() / 1000),
      content: await nip04Encrypt(nostrPrivateKey, pubkey, message), // @JsParams message
    }

    Lit.Actions.setResponse({
      response: JSON.stringify(finalizeEvent(nostrMessage, nostrPrivateKey)),
    })
  } catch (err) {
    const errorMessage = 'Error: When encrypting nostr message - ' + err.message
    Lit.Actions.setResponse({ response: errorMessage })
  }
})()
