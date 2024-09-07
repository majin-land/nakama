import { LIT_PREFIX } from './constants.ts'
import { EncryptedDirectMessage } from 'https://esm.sh/nostr-tools/kinds'
import { encrypt as nip04Encrypt } from 'https://esm.sh/nostr-tools@2.7.2/nip04.js'
import { finalizeEvent } from 'https://esm.sh/nostr-tools@2.7.2/pure'

export function removeSaltFromDecryptedKey(decryptedPrivateKey) {
  if (!decryptedPrivateKey.startsWith(LIT_PREFIX)) {
    throw new Error(
      `Error: PKey was not encrypted with salt; all wrapped keys must be prefixed with '${LIT_PREFIX}'`,
    )
  }

  return decryptedPrivateKey.slice(LIT_PREFIX.length)
}

export async function nostrResponse(pubkey, privatekey, message) {
  const nostrReply = {
    kind: EncryptedDirectMessage,
    tags: [['p', pubkey]],
    created_at: Math.floor(Date.now() / 1000),
    content: await nip04Encrypt(privatekey, pubkey, message),
  }

  return JSON.stringify(finalizeEvent(nostrReply, privatekey))
}
