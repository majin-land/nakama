import { EncryptedDirectMessage } from "https://esm.sh/nostr-tools/kinds";
import { getPublicKey, finalizeEvent, verifyEvent } from "https://esm.sh/nostr-tools@2.7.2/pure";
import { encrypt as nip04Encrypt } from "https://esm.sh/nostr-tools@2.7.2/nip04.js";

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

const LIT_PREFIX = 'lit_' as const;

(async () => {
  try {
    // Validate nostr request
    const isValid = verifyEvent(nostrRequest); // @JsParams nostrRequest
    if (!isValid) throw new Error('Invalid nostr request');

    let decryptedPrivateKey;
    try {
      decryptedPrivateKey = await Lit.Actions.decryptToSingleNode({
        accessControlConditions,
        ciphertext,
        dataToEncryptHash,
        chain: 'ethereum',
        authSig: null,
      });
    } catch (err) {
      const errorMessage =
        'Error: When decrypting to a single node- ' + err.message;
      Lit.Actions.setResponse({ response: errorMessage });
      return;
    }

    if (!decryptedPrivateKey) {
      // Exit the nodes which don't have the decryptedData
      return;
    }

    // Extract the nostr private key
    let nostrPrivateKey;
    try {
      nostrPrivateKey = decryptedPrivateKey.slice(LIT_PREFIX.length).slice(2);
    } catch (err) {
      Lit.Actions.setResponse({ response: err.message });
      return;
    }

    const nostrReplyMessage = JSON.stringify(
      '1. register /n 2. send transaction /n 3. top up /n 4. voucher',
    )

    // console.log(privateKey, decryptedPrivateKey)

    const nostrReply = {
      kind: EncryptedDirectMessage,
      tags: [['p', nostrRequest.pubkey]],
      created_at: Math.floor(Date.now() / 1000),
      content: await nip04Encrypt(nostrPrivateKey, nostrRequest.pubkey, nostrReplyMessage),
    };

    Lit.Actions.setResponse({
      response: JSON.stringify(finalizeEvent(nostrReply, nostrPrivateKey)),
    });

  } catch (err) {
    const errorMessage = 'Error: When signing message- ' + err.message;
    Lit.Actions.setResponse({ response: errorMessage });
  }
})();
