import { Metadata } from "https://esm.sh/nostr-tools/kinds";
import { getPublicKey, finalizeEvent } from "https://esm.sh/nostr-tools@2.7.2/pure";

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

function removeSaltFromDecryptedKey(decryptedPrivateKey) {
  if (!decryptedPrivateKey.startsWith(LIT_PREFIX)) {
    throw new Error(
      `Error: PKey was not encrypted with salt; all wrapped keys must be prefixed with '${LIT_PREFIX}'`
    );
  }

  return decryptedPrivateKey.slice(LIT_PREFIX.length);
}

(async () => {
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

  let privateKey;
  try {
    privateKey = removeSaltFromDecryptedKey(decryptedPrivateKey);
  } catch (err) {
    Lit.Actions.setResponse({ response: err.message });
    return;
  }

  const nostrPubkey = getPublicKey(ethers.utils.arrayify(privateKey))

  const metadataEvent = {
    kind: Metadata,
    content: JSON.stringify(unsignedMetadata),
    tags: [
      ['p', nostrPubkey],
      ['d', 'nostr-bot'],
    ],
    created_at: Math.floor(Date.now() / 1000),
    // pubkey: ...,
    // id: ...,
    // sig: ...,
  };

  try {
    const response = finalizeEvent(metadataEvent, ethers.utils.arrayify(privateKey));
    Lit.Actions.setResponse({ response: JSON.stringify(response) });
  } catch (err) {
    const errorMessage = 'Error: When signing message- ' + err.message;
    Lit.Actions.setResponse({ response: errorMessage });
  }
})();
