/**
 * Signs a message with the Ethers wallet which is also decrypted inside the Lit Action.
 *
 * @jsParam accessControlConditions - The access control conditions that allow only the pkpAddress to decrypt the Wrapped Key
 * @jsParam pubkey - client nostr pubkey
 * @jsParam supabaseUrl - supabase configs
 * @jsParam supabaseServiceRole - supabase configs
 * @jsParam supabaseEmail - supabase configs
 * @jsParam supabasePassword - supabase configs
 *
 * @returns { Promise<string> } - Returns a message signed by the Ethers Wrapped key, or returns an error if any.
 */

import { hkdf } from 'https://esm.sh/@noble/hashes@1.4.0/hkdf.js'
import { pbkdf2Async } from 'https://esm.sh/@noble/hashes@1.4.0/pbkdf2.js'
import { sha512 } from 'https://esm.sh/@noble/hashes@1.4.0/sha512.js'
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { sha256 } from 'https://esm.sh/@noble/hashes@1.4.0/sha256.js'

const LIT_PREFIX = 'lit_'

export const register = async (params) => {
  const {
    pubkey,
    accessControlConditions,
    supabaseUrl,
    supabaseServiceRole,
    supabaseEmail,
    supabasePassword,
  } = params
  const SUPABASE_URL = supabaseUrl // @JSParams supabaseUrl
  const SUPABASE_SERVICE_ROLE = supabaseServiceRole // @JSParams supabaseServiceRole
  const SUPABASE_ADMIN_EMAIL = supabaseEmail // @JSParams supabaseEmail
  const SUPABASE_ADMIN_PASSWORD = supabasePassword // @JSParams supabasePassword

  let supabaseClient

  try {
    // Generate random entropy
    const random = crypto.getRandomValues(new Uint8Array(32))
    const entropy = hkdf(
      sha256,
      ethers.utils.arrayify(ethers.utils.hexlify(random)),
      new Uint8Array(32),
      'seed',
      32,
    )

    // Generate BIP39 Seed
    const password = ''
    const encoder = new TextEncoder()
    const salt = encoder.encode('mnemonic' + password)
    const seed = await pbkdf2Async(sha512, entropy, salt, { c: 2048, dkLen: 64 })

    // Generate BIP32 Root Key
    const rootHDNode = ethers.utils.HDNode.fromSeed(seed)
    const { extendedKey: bip32RootKey } = rootHDNode

    // Ensure all nodes agree on the same BIP32 Root Key
    const rootKeyIds: string[] = await Lit.Actions.broadcastAndCollect({
      name: 'response',
      value: sha256(bip32RootKey),
    })
    if (!rootKeyIds.every((id) => id === rootKeyIds[0])) {
      throw new Error(
        'Node synchronization failed: Expected all responses to be ' +
          rootKeyIds[0] +
          ' , but got variations: ' +
          rootKeyIds.join(', '),
      )
    }

    // Derive BIP32 path for Ethereum network
    const networkPath = "m/44'/60'/0'/0"

    // Generate accounts from the derived HDNode
    const accounts = [0].map((num) => {
      const path = networkPath + '/' + num
      const hd = rootHDNode.derivePath(path)
      const wallet = new ethers.Wallet(hd)
      const { address, publicKey: publicKeyLong } = wallet
      return [path, { address, publicKey: hd.publicKey, publicKeyLong }]
    })

    // Encrypt and store user keystore
    const utf8Encode = new TextEncoder()

    const { ciphertext: seedCiphertext, dataToEncryptHash: seedDataToEncryptHash } =
      await Lit.Actions.encrypt({
        accessControlConditions,
        to_encrypt: utf8Encode.encode(LIT_PREFIX + seed),
      })

    const { ciphertext: entropyCiphertext, dataToEncryptHash: entropyDataToEncryptHash } =
      await Lit.Actions.encrypt({
        accessControlConditions,
        to_encrypt: utf8Encode.encode(LIT_PREFIX + entropy),
      })

    const userKeystore = JSON.stringify({
      pubkey, // @JSParams pubkey
      seedCiphertext,
      seedDataToEncryptHash,
      entropyCiphertext,
      entropyDataToEncryptHash,
    })

    supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
    await supabaseClient.auth.signInWithPassword({
      email: SUPABASE_ADMIN_EMAIL,
      password: SUPABASE_ADMIN_PASSWORD,
    })

    const { data: existedData } = await supabaseClient
      .from('keystore')
      .select('id')
      .eq('pubkey', pubkey) // @JSParams pubkey
      .single()

    let message = ''
    if (existedData) {
      message = 'You already have a wallet'
    } else {
      const { error } = await supabaseClient.from('keystore').insert({
        key: userKeystore,
        pubkey: pubkey, // @JSParams pubkey
      })
      if (error) throw error

      // Create and send a Nostr EncryptedDirectMessage
      message = accounts.reduce((acc, [path, account]) => {
        return (
          acc +
          (path.startsWith("m/44'/60'/")
            ? 'Ethereum account [' + path + ']: ' + account.address + '\n'
            : 'BIP32 address [' + path + ']: ' + account.address + '\n')
        )
      }, 'You have been registered on with Nakama!\n\n')
    }

    Lit.Actions.setResponse({ response: message })
  } catch (error) {
    Lit.Actions.setResponse({ response: error.message })
  } finally {
    if (supabaseClient && supabaseClient.auth) {
      supabaseClient.auth.signOut()
    }
  }
}
