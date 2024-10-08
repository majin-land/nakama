/**
 * Signs a message with the Ethers wallet which is also decrypted inside the Lit Action.
 *
 * @jsParam pkpAddress - The Eth address of the PKP which is associated with the Wrapped Key
 * @jsParam ciphertext - The encrypted Wrapped Key
 * @jsParam dataToEncryptHash - The hash for the encrypted Wrapped Key
 * @jsParam messageToSign - The unsigned message to be signed by the Wrapped Key
 * @jsParam accessControlConditions - The access control conditions that allow only the pkpAddress to decrypt the Wrapped Key
 * @jsParam nostrRequest - request from nostr
 *
 * @returns { Promise<string> } - Returns a message signed by the Ethers Wrapped key, or returns an error if any.
 */

import { hkdf } from 'https://esm.sh/@noble/hashes@1.4.0/hkdf.js'
import { pbkdf2Async } from 'https://esm.sh/@noble/hashes@1.4.0/pbkdf2.js'
import { sha512 } from 'https://esm.sh/@noble/hashes@1.4.0/sha512.js'
import { verifyEvent } from 'https://esm.sh/nostr-tools@2.7.2/pure'
import { decrypt as nip04Decrypt } from 'https://esm.sh/nostr-tools@2.7.2/nip04.js'
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { sha256 } from 'https://esm.sh/@noble/hashes@1.4.0/sha256.js'
const { nostrResponse } = require('../utils.js')

const LIT_PREFIX = 'lit_'

const go = async () => {
  const SUPABASE_URL = supabase.url // @JSParams supabase.url
  const SUPABASE_SERVICE_ROLE = supabase.serviceRole // @JSParams supabase.serviceRole
  const SUPABASE_ADMIN_EMAIL = supabase.email // @JSParams supabase.email
  const SUPABASE_ADMIN_PASSWORD = supabase.password // @JSParams supabase.password

  let supabaseClient
  let nostrPrivateKey

  try {
    // Validate nostr request
    const isValid = verifyEvent(nostrRequest) // @JsParams nostrRequest
    if (!isValid) throw new Error('Invalid nostr request')

    // Generate random entropy
    const random = crypto.getRandomValues(new Uint8Array(32))

    // Broadcast and collect entropy from nodes
    const entropies: string[] = await Lit.Actions.broadcastAndCollect({
      name: 'seeds',
      value: ethers.utils.hexlify(random),
    })

    // Combine entropies to form a single entropy hex string
    const entropyHex = entropies.sort().reduce((acc, s) => acc + s.slice(2), '0x')
    const entropy = hkdf(sha256, ethers.utils.arrayify(entropyHex), new Uint8Array(32), 'seed', 32)

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
        `Node synchronization failed: Expected all responses to be "${rootKeyIds[0]}", but got variations: [${rootKeyIds.join(', ')}]`,
      )
    }

    // Derive BIP32 path for Ethereum network
    const networkPath = "m/44'/60'/0'/0"

    // Generate accounts from the derived HDNode
    const accounts = [0].map((num) => {
      const path = `${networkPath}/${num}`
      const hd = rootHDNode.derivePath(path)
      const wallet = new ethers.Wallet(hd)
      const { address, publicKey: publicKeyLong } = wallet
      return [path, { address, publicKey: hd.publicKey, publicKeyLong }]
    })

    // Decrypt the private key using Lit Actions
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
      throw new Error('Error: When decrypting to a single node- ' + err.message)
    }

    // Encrypt and store user keystore
    const userKeystore = await Lit.Actions.runOnce(
      { waitForResponse: true, name: 'encryptedPrivateKey' },
      async () => {
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

        return JSON.stringify({
          pubkey: nostrRequest.pubkey,
          seedCiphertext,
          seedDataToEncryptHash,
          entropyCiphertext,
          entropyDataToEncryptHash,
        })
      },
    )

    // Prepare data to sign
    const dataToSign = ethers.utils.arrayify(
      ethers.utils.keccak256(new TextEncoder().encode(userKeystore)),
    )

    // Sign data using ECDSA
    const sig = await Lit.Actions.signAndCombineEcdsa({
      toSign: dataToSign,
      publicKey,
      sigName: 'sigSecretKey',
    })

    // Extract the nostr private key
    try {
      nostrPrivateKey = decryptedPrivateKey.slice(LIT_PREFIX.length).slice(2)
    } catch (err) {
      throw err
    }

    // Decrypt the content of the nostr request
    const payload = await nip04Decrypt(nostrPrivateKey, nostrRequest.pubkey, nostrRequest.content)
    console.info('Received DM:', payload)
    if (!payload.toLocaleLowerCase().startsWith('register')) {
      throw new Error('invalid payload')
    }
    // Store encrypted keystore in Supabase
    const response = await Lit.Actions.runOnce(
      { waitForResponse: true, name: 'storeEncryptedKeystore' },
      async () => {
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
        await supabaseClient.auth.signInWithPassword({
          email: SUPABASE_ADMIN_EMAIL,
          password: SUPABASE_ADMIN_PASSWORD,
        })

        const { data: existedData } = await supabaseClient
          .from('keystore')
          .select('id')
          .eq('pubkey', nostrRequest.pubkey)
          .single()

        let message = ''
        if (existedData) {
          message = 'You already have a wallet'
        } else {
          const { error } = await supabaseClient.from('keystore').insert({
            key: userKeystore,
            signature: sig,
            pubkey: nostrRequest.pubkey,
          })
          if (error) throw error

          // Create and send a Nostr EncryptedDirectMessage
          message = accounts.reduce((acc, [path, account]) => {
            return (
              acc +
              (path.startsWith("m/44'/60'/")
                ? `Ethereum account [${path}]: ${account.address}\n`
                : `BIP32 address [${path}]: ${account.address}\n`)
            )
          }, 'You have been registered on the Lit Protocol!\n\n')
        }

        return await nostrResponse(nostrRequest.pubkey, nostrPrivateKey, message)
      },
    )

    Lit.Actions.setResponse({ response })
  } catch (error) {
    if (nostrPrivateKey) {
      Lit.Actions.setResponse({
        response: await nostrResponse(nostrRequest.pubkey, nostrPrivateKey, error.message),
      })
    } else {
      Lit.Actions.setResponse({ response: error.message })
    }
  } finally {
    if (supabaseClient && supabaseClient.auth) {
      supabaseClient.auth.signOut()
    }
  }
}

go()
