import {
  getPublicKey,
  nip04,
  SimplePool,
  finalizeEvent,
  verifyEvent,
  type EventTemplate,
  VerifiedEvent,
  verifiedSymbol,
} from 'nostr-tools'
import { hkdf } from '@noble/hashes/hkdf'
import { sha256 } from '@noble/hashes/sha256'
import { hexToBytes } from '@noble/hashes/utils'
import { EncryptedDirectMessage, Metadata, RelayList } from 'nostr-tools/kinds'
import { npubEncode } from 'nostr-tools/nip19'
import type { SubCloser } from 'nostr-tools/abstract-pool'
import { createClient } from '@supabase/supabase-js'

import { LitNodeClient } from '@lit-protocol/lit-node-client'
import { LIT_RPC, LitNetwork, LIT_CHAINS } from '@lit-protocol/constants'
import {
  createSiweMessageWithRecaps,
  generateAuthSig,
  LitAbility,
  LitActionResource,
  LitPKPResource,
} from '@lit-protocol/auth-helpers'
import { EthWalletProvider } from '@lit-protocol/lit-auth-client'
import * as ethers from 'ethers'
// import { api } from '@lit-protocol/wrapped-keys'
import { api, getPkpAccessControlCondition, getFirstSessionSig } from '@nakama/social-keys'
import * as fs from 'fs'

// import { api } from '@nakama/social-keys'

// const supabaseUrl = 'https://kmrgcdhoqxftcrfdaclr.supabase.co'
// const supabaseKey = process.env.SUPABASE_KEY
// const supabase = createClient(supabaseUrl, supabaseKey)

const {
  generatePrivateKey,
  getEncryptedKey,
  exportPrivateKey,
  fetchPrivateKey,
  signTransactionWithEncryptedKey,
} = api

const PRIVATE_KEY = process.env.PRIVATE_KEY
const GENERATE_WALLET_IPFS_ID = process.env.LIT_GENERATE_ADDRESS_IPFS
const PKP_PUBLIC_KEY = process.env.PKP_PUBLIC_KEY
const WRAPPED_KEY_ID = process.env.RELAY_BOT_WRAPPED_KEY_ID

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_ADMIN_EMAIL = process.env.SUPABASE_ADMIN_EMAIL
const SUPABASE_ADMIN_PASSWORD = process.env.SUPABASE_ADMIN_PASSWORD

const LAEncryptRootKey = fs.readFileSync('./apps/lit-action/dist/encrypt-root-key.js', 'utf8')
// const litActionCode = fs.readFileSync('./apps/lit-action/dist/sign-nostr-metadata.js', 'utf8')
const LASendTransaction = fs.readFileSync('./apps/lit-action/dist/sign-transaction.js', 'utf8')

export interface PartialRelayListEvent extends EventTemplate {
  kind: typeof RelayList
  tags: (['r', string] | ['r', string, 'read' | 'write'])[]
  content: ''
}

export async function startService({
  pool = new SimplePool(),
  seedKey = process.env.SEED_KEY,
  keyIndex = process.env.KEY_INDEX ? parseInt(process.env.KEY_INDEX) : 0,
}: {
  pool?: SimplePool
  seedKey?: string
  keyIndex?: number
} = {}) {
  if (!seedKey) throw new Error('No seed key provided')
  const [nostrSeckey, nostrPubkey] = getAppKeyPair(seedKey, keyIndex)

  if (!nostrSeckey || !nostrPubkey) throw new Error('No nostr key pair generated')

  console.info('npub:', npubEncode(nostrPubkey))

  const relays = await loadNostrRelayList(nostrPubkey, nostrSeckey, { pool })

  console.info('nostrRelays:', relays)

  const profileMetadata = await pool.get(Object.keys(relays), {
    kinds: [Metadata],
    authors: [nostrPubkey],
  })

  console.log(profileMetadata, 'profileMetadataprofileMetadataprofileMetadata')
  if (!profileMetadata) {
    throw new Error('Please setup nostr bot first!')
  } else {
    console.info('Profile Metadata exists', profileMetadata)
  }

  const subDmOnly = pool.subscribeMany(
    Object.keys(relays),
    [
      {
        kinds: [EncryptedDirectMessage], // DMs
        '#p': [process.env.NOSTR_PUBKEY], // only want DMs for us
        since: Math.floor(Date.now() / 1000), // only want DMs since now
      },
    ],
    {
      async onevent(event) {
        console.info('Received DM:', event)
        console.log('[Symbol(verified)]', event['[Symbol(verified)]'])

        if (verifyEvent(event)) {
          // const payload = await nip04.decrypt(nostrSeckey, event.pubkey, event.content)
          //   console.info('Payload:', payload, nostrSeckey, 'nostrSeckey')
          //   // JSON.parse(payload)
          //   if (payload.toLowerCase().includes('get-key')) {
          //     console.log('excecute... getWrappedKey')
          //     const response = await getWrappedKey()
          //     console.log('responseresponse... getWrappedKey', response)
          //     if (response) {
          //       const content = JSON.stringify(response)
          //       const postEvent: EventTemplate = {
          //         kind: EncryptedDirectMessage,
          //         content,
          //         tags: [['p', event.pubkey]],
          //         created_at: Math.floor(Date.now() / 1000),
          //       }
          //       await Promise.all(
          //         pool.publish(Object.keys(relays), finalizeEvent(postEvent, nostrSeckey)),
          //       )
          //       console.info('Response sent to user:', content)
          //     }
          //   }
          //   if (payload.toLowerCase().includes('generate-key')) {
          //     const response = await generateWrappedKey(npubEncode(nostrPubkey))
          //     if (response) {
          //       const content = `✅ Generated wrapped key with id: ${response.id} and public key: ${response.generatedPublicKey}`
          //       const postEvent: EventTemplate = {
          //         kind: EncryptedDirectMessage,
          //         content,
          //         tags: [['p', event.pubkey]],
          //         created_at: Math.floor(Date.now() / 1000),
          //       }
          //       await Promise.all(
          //         pool.publish(Object.keys(relays), finalizeEvent(postEvent, nostrSeckey)),
          //       )
          //     }
          //   }
          // if (payload.toLowerCase().includes('register')) {
          //   const result = await generateUserWallet(event)
          //   if (result) {
          //     console.log(result.response)

          //     const content = JSON.parse(result.response)
          //     if (content) {
          //       await Promise.all(pool.publish(Object.keys(relays), content))
          //     }
          //     console.info('Response sent to user:', content)
          //   }
          // }

          //   // this format will json format
          //   if (payload.toLowerCase().includes('send')) {
          // const result = await generateUserWallet(event)
          const result = await sendTransaction(event)
          console.log(result)
          if (result.response) {
            const content = JSON.parse(result.response)
            content[verifiedSymbol] = true
            await Promise.any(pool.publish(Object.keys(relays), content))
            console.log('published', content)
          }
        }
        // }
        // }
      },
      // oneose() {
      //   subDmOnly.close();
      // },
    },
  )

  return {
    pool,
    subs: [subDmOnly],
  }
}

export function stopService({ pool, subs }: { pool: SimplePool; subs: SubCloser[] }) {
  subs.forEach((sub) => sub.close())
  return pool.destroy()
}

export function numToBytes(num: number, bytes: number) {
  const b = new ArrayBuffer(bytes)
  const v = new DataView(b)
  v.setUint32(0, num)
  return new Uint8Array(b)
}

export function getAppKeyPair(initialKey: string, keyIndex: number) {
  if (!initialKey) return []

  // Derive the Nostr Key from Metadata Key
  const dkLen = 32 // HKDF output key length
  const salt = numToBytes(keyIndex, dkLen) // HKDF salt is set to a zero-filled byte sequence equal to the hash's output length
  const info = 'nostr' // HKDF info is set to an application-specific byte sequence distinct from other uses of HKDF in the application
  const seckey = hkdf(sha256, hexToBytes(initialKey), salt, info, dkLen)

  const pubkey = getPublicKey(seckey)
  return [seckey, pubkey] as const
}

export async function loadNostrRelayList(
  pubKey: string,
  secKey: Uint8Array,
  opts: {
    pool?: SimplePool
    nostr_relays?: { [url: string]: { read: boolean; write: boolean } }
  } = {},
) {
  const { pool = new SimplePool(), nostr_relays = {} } = opts

  // See: https://github.com/nostr-protocol/nips/blob/master/65.md#when-to-use-read-and-write
  const nostr_write_relays = Object.entries(nostr_relays)
    .filter(([_url, r]) => r.write)
    .map(([url, _r]) => url)
  if (!nostr_write_relays.length) nostr_write_relays.push('wss://relay.damus.io')

  const relay_list_note = await pool.get(nostr_write_relays, {
    kinds: [RelayList],
    authors: [pubKey],
  })
  if (relay_list_note && verifyEvent(relay_list_note)) {
    // Use existing relay list
    relay_list_note.tags
      .filter((tag) => tag[0] === 'r')
      .forEach((tag) => {
        if (tag.length === 3) {
          const [, relay, typ] = tag
          if (typ === 'read') {
            nostr_relays[relay] = { read: true, write: false }
          } else if (typ === 'write') {
            nostr_relays[relay] = { read: false, write: false }
          }
        } else if (tag.length === 2) {
          const [, relay] = tag
          nostr_relays[relay] = { read: true, write: true }
        }
      })
  } else {
    // Write relay list
    const nostr_read_relays = Object.entries(nostr_relays)
      .filter(([_url, r]) => r.read)
      .map(([url, _r]) => url)
    if (!nostr_read_relays.length) nostr_read_relays.push('wss://relay.damus.io')

    const event: PartialRelayListEvent = {
      kind: RelayList,
      content: '',
      tags: [
        ...nostr_write_relays.map((relay) =>
          nostr_read_relays.includes(relay)
            ? (['r', relay] as ['r', string])
            : (['r', relay, 'write'] as ['r', string, 'write']),
        ),
        ...nostr_read_relays
          .filter((relay) => !nostr_write_relays.includes(relay))
          .map((relay) => ['r', relay, 'read'] as ['r', string, 'read']),
      ],
      created_at: Math.floor(Date.now() / 1000),
    }

    await Promise.all(pool.publish(nostr_write_relays, finalizeEvent(event, secKey)))

    nostr_read_relays.forEach((relay) => {
      nostr_relays[relay] = nostr_write_relays.includes(relay)
        ? { read: true, write: true }
        : { read: true, write: false }
    })
  }

  return nostr_relays
}

export function generateEtherSigner() {
  if (!PRIVATE_KEY) return
  const ethersSigner = new ethers.Wallet(
    PRIVATE_KEY,
    new ethers.providers.JsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE),
  )

  return ethersSigner
}

export function generateLitNodeClient() {
  const litNodeClient = new LitNodeClient({
    alertWhenUnauthorized: false,
    litNetwork: LitNetwork.DatilDev,
    debug: false,
  })

  return litNodeClient
}

export async function getWrappedKey() {
  console.log(PKP_PUBLIC_KEY, 'PKP_PUBLIC_KEY', WRAPPED_KEY_ID, 'WRAPPED_KEY_ID')
  if (!PKP_PUBLIC_KEY || !WRAPPED_KEY_ID) return
  console.log('....')
  let litNodeClient: LitNodeClient
  try {
    const ethersSigner = generateEtherSigner()
    console.log('🔄 Connecting to Lit network...')
    litNodeClient = generateLitNodeClient()
    await litNodeClient.connect()
    console.log('✅ Connected to Lit network')

    console.log('🔄 Getting PKP Session Sigs...')
    const pkpSessionSigs = await litNodeClient.getPkpSessionSigs({
      pkpPublicKey: PKP_PUBLIC_KEY,
      authMethods: [
        await EthWalletProvider.authenticate({
          signer: ethersSigner,
          litNodeClient,
          expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes
        }),
      ],
      resourceAbilityRequests: [
        {
          resource: new LitActionResource('*'),
          ability: LitAbility.LitActionExecution,
        },
      ],
      expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes
    })
    console.log('✅ Got PKP Session Sigs')

    console.log('🔄 Getting Wrapped Key metadata...')
    const wrappedKeyMetadata = await getEncryptedKey({
      pkpSessionSigs,
      id: WRAPPED_KEY_ID,
      litNodeClient,
    })
    console.log(`✅ Got Wrapped Key metadata`)
    return wrappedKeyMetadata
  } catch (error) {
    console.error
  } finally {
    litNodeClient?.disconnect()
  }
}

export async function generateWrappedKey(nostrNpub: string) {
  if (!PKP_PUBLIC_KEY) return
  let litNodeClient: LitNodeClient
  try {
    const ethersSigner = generateEtherSigner()
    console.log('🔄 Connecting to Lit network...')
    litNodeClient = generateLitNodeClient()
    await litNodeClient.connect()
    console.log('✅ Connected to Lit network')

    console.log('🔄 Getting PKP Session Sigs...')
    const pkpSessionSigs = await litNodeClient.getPkpSessionSigs({
      pkpPublicKey: PKP_PUBLIC_KEY,
      authMethods: [
        await EthWalletProvider.authenticate({
          signer: ethersSigner,
          litNodeClient,
          expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes
        }),
      ],
      resourceAbilityRequests: [
        {
          resource: new LitActionResource('*'),
          ability: LitAbility.LitActionExecution,
        },
      ],
      expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes
    })
    console.log('✅ Got PKP Session Sigs')

    console.log('🔄 Generating wrapped key...')
    const response = await generatePrivateKey({
      pkpSessionSigs,
      network: 'evm',
      memo: nostrNpub,
      litNodeClient,
    })
    console.log(
      `✅ Generated wrapped key with id: ${response.id} and public key: ${response.generatedPublicKey}`,
    )
    return response
  } catch (error) {
    console.error(error)
  } finally {
    litNodeClient?.disconnect()
  }
}

export async function generateUserWallet(event: EventTemplate) {
  if (!PKP_PUBLIC_KEY) return
  let litNodeClient: LitNodeClient

  try {
    const ethersSigner = generateEtherSigner()

    console.log('🔄 Connecting to Lit network...')
    const litNodeClient = generateLitNodeClient()
    await litNodeClient.connect()
    console.log('✅ Connected to Lit network')

    const sessionSigs = await litNodeClient.getPkpSessionSigs({
      pkpPublicKey: PKP_PUBLIC_KEY!,
      //  capabilityAuthSigs: [capacityDelegationAuthSig],
      authMethods: [
        await EthWalletProvider.authenticate({
          signer: ethersSigner,
          litNodeClient,
          expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes
        }),
      ],
      resourceAbilityRequests: [
        {
          resource: new LitPKPResource('*'),
          ability: LitAbility.PKPSigning,
        },
        {
          resource: new LitActionResource('*'),
          ability: LitAbility.LitActionExecution,
        },
      ],
      expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes
    })

    const pkpAddress = ethers.utils.computeAddress(`0x${PKP_PUBLIC_KEY}`)

    const sessionSig = getFirstSessionSig(sessionSigs)

    const storedKeyMetadata = await fetchPrivateKey({
      id: WRAPPED_KEY_ID,
      sessionSig: sessionSig,
      litNetwork: litNodeClient.config.litNetwork,
    })

    const allowPkpAddressToDecrypt = getPkpAccessControlCondition(storedKeyMetadata.pkpAddress)

    const jsParams = {
      publicKey: PKP_PUBLIC_KEY,
      ciphertext: storedKeyMetadata.ciphertext,
      dataToEncryptHash: storedKeyMetadata.dataToEncryptHash,
      pkpAddress,
      accessControlConditions: [allowPkpAddressToDecrypt],
      nostrRequest: event,
      supabase: {
        url: SUPABASE_URL,
        serviceRole: SUPABASE_SERVICE_ROLE_KEY,
        email: SUPABASE_ADMIN_EMAIL,
        password: SUPABASE_ADMIN_PASSWORD,
      },
    }

    const generateWallet = await litNodeClient.executeJs({
      sessionSigs,
      // ipfsId: GENERATE_WALLET_IPFS_ID,
      code: LAEncryptRootKey,
      jsParams,
    })

    return generateWallet
  } catch (error) {
    console.log('ERROR generateWallet')
    console.error(error)
  } finally {
    litNodeClient?.disconnect()
  }
}

export async function sendTransaction(event: VerifiedEvent) {
  if (!GENERATE_WALLET_IPFS_ID || !PKP_PUBLIC_KEY) return
  let litNodeClient: LitNodeClient

  try {
    const ethersSigner = generateEtherSigner()

    console.log('🔄 Connecting to Lit network...')
    const litNodeClient = generateLitNodeClient()
    await litNodeClient.connect()
    console.log('✅ Connected to Lit network')

    const sessionSigs = await litNodeClient.getPkpSessionSigs({
      pkpPublicKey: PKP_PUBLIC_KEY!,
      //  capabilityAuthSigs: [capacityDelegationAuthSig],
      authMethods: [
        await EthWalletProvider.authenticate({
          signer: ethersSigner,
          litNodeClient,
          expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes
        }),
      ],
      resourceAbilityRequests: [
        {
          resource: new LitPKPResource('*'),
          ability: LitAbility.PKPSigning,
        },
        {
          resource: new LitActionResource('*'),
          ability: LitAbility.LitActionExecution,
        },
      ],
      expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes
    })

    const pkpAddress = ethers.utils.computeAddress(`0x${PKP_PUBLIC_KEY}`)

    const sessionSig = getFirstSessionSig(sessionSigs)

    const storedKeyMetadata = await fetchPrivateKey({
      id: WRAPPED_KEY_ID,
      sessionSig: sessionSig,
      litNetwork: litNodeClient.config.litNetwork,
    })

    const allowPkpAddressToDecrypt = getPkpAccessControlCondition(storedKeyMetadata.pkpAddress)

    // const accessControlConditions = [
    //   {
    //     contractAddress: '',
    //     standardContractType: '',
    //     chain: 'ethereum',
    //     method: '',
    //     parameters: [':userAddress'],
    //     returnValueTest: {
    //       comparator: '=',
    //       value: pkpAddress,
    //     },
    //   },
    // ]

    const getChainInfo = (chain: keyof typeof LIT_CHAINS) => {
      if (LIT_CHAINS[chain] === undefined)
        throw new Error(`Chain: ${chain} is not supported by Lit`)

      return {
        rpcUrl: LIT_CHAINS[chain].rpcUrls[0],
        chainId: LIT_CHAINS[chain].chainId,
      }
    }

    const chainInfo = getChainInfo('yellowstone')

    const ethersProvider = new ethers.providers.JsonRpcProvider(chainInfo.rpcUrl)

    // const ethAddress = ethers.utils.computeAddress('0x04ab898b2a19e08a57b958435fbf567addbfa74c74a243407c1e30e1bbfa87f116987c012698cb4d02bada37def4accec0c15af67822648b3a0304750f8957a21c')

    const ethAddress = ethers.utils.computeAddress(`0x${PKP_PUBLIC_KEY}`)

    // const unsignedTransaction = {
    //   toAddress: ethersSigner.address,
    //   value: '0.0001',
    //   gasLimit: 21_000,
    //   // gasPrice: (await ethersSigner.getGasPrice()).toHexString(),
    //   nonce: await ethersProvider.getTransactionCount(ethAddress),
    //   // nonce: await litNodeClient.getLatestBlockhash(),
    //   chainId: chainInfo.chainId,
    //   chain: 'yellowstone',
    // }

    // const litTransaction = {
    //   chainId: chainInfo.chainId,
    //   chain: "yellowstone",
    //   toAddress: ethersSigner.address,
    //   value: "0.0001",
    //   // Manually specifying because the generated private key doesn't hold a balance and ethers
    //   // fails to estimate gas since the tx simulation fails with insufficient balance error
    //   gasLimit: 21_000,
    // };

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    await supabaseClient.auth.signInWithPassword({
      email: SUPABASE_ADMIN_EMAIL,
      password: SUPABASE_ADMIN_PASSWORD,
    })

    const { data: keystore } = await supabaseClient
      .from('keystore')
      .select('key')
      .eq('pubkey', event.pubkey)
      .single()

    if (!keystore) {
      throw new Error('No keystore found for the given pubkey')
    }

    const userKeystore = JSON.parse(keystore.key)

    // console.log('signedTransaction read ....')
    // const signedTransaction = await signTransactionWithEncryptedKey({
    //   pkpSessionSigs: sessionSigs,
    //   network: 'nostr',
    //   id: WRAPPED_KEY_ID,
    //   unsignedTransaction: event,
    //   broadcast: false,
    //   litNodeClient,
    //   seedCiphertext: userKeystore.seedCiphertext,
    //   seedDataToEncryptHash: userKeystore.seedDataToEncryptHash,
    // })

    // console.log('signedTransaction', signedTransaction)

    const sendTransactionWithLitAction = await litNodeClient.executeJs({
      sessionSigs,
      // ipfsId: GENERATE_WALLET_IPFS_ID,
      code: LASendTransaction,
      jsParams: {
        publicKey: PKP_PUBLIC_KEY,
        ciphertext: storedKeyMetadata.ciphertext,
        dataToEncryptHash: storedKeyMetadata.dataToEncryptHash,
        pkpAddress,
        accessControlConditions: [allowPkpAddressToDecrypt],
        nostrRequest: event,
        supabase: {
          url: SUPABASE_URL,
          serviceRole: SUPABASE_SERVICE_ROLE_KEY,
          email: SUPABASE_ADMIN_EMAIL,
          password: SUPABASE_ADMIN_PASSWORD,
        },
      },
    })

    console.log('sendTransactionWithLitAction', sendTransactionWithLitAction)

    // console.log('generatesend.response', JSON.stringify(sendTransactionWithLitAction, null, 2))
    return
  } catch (error) {
    console.error(error)
  } finally {
    litNodeClient?.disconnect()
  }
}
