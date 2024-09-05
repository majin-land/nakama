import * as ethers from 'ethers'
import { SimplePool, VerifiedEvent } from 'nostr-tools'
import { LitNodeClient } from '@lit-protocol/lit-node-client'
import { LIT_RPC, LitNetwork } from '@lit-protocol/constants'
import { LitAbility, LitActionResource } from '@lit-protocol/auth-helpers'
import { EthWalletProvider } from '@lit-protocol/lit-auth-client'
import { EncryptedDirectMessage, Metadata, RelayList } from 'nostr-tools/kinds'
import { npubEncode } from 'nostr-tools/nip19'

import {
  getPublicKey,
  nip04,
  SimplePool,
  finalizeEvent,
  verifyEvent,
  type EventTemplate,
} from 'nostr-tools'

import {
  api,
  SignMetadataWithEncryptedKeyParams,
  getPkpAccessControlCondition,
} from '@nakama/social-keys'

import { loadNostrRelayList } from './utils'

const { generateNostrPrivateKey, signMetadataWithEncryptedKey, getEncryptedKey } = api

const ETHEREUM_PRIVATE_KEY = process.env.PRIVATE_KEY
const PKP_PUBLIC_KEY = process.env.PKP_PUBLIC_KEY

const PKP_KEY = `0x${PKP_PUBLIC_KEY}`

export interface PartialRelayListEvent extends EventTemplate {
  kind: typeof RelayList
  tags: (['r', string] | ['r', string, 'read' | 'write'])[]
  content: ''
}

export const action = async (pkpPublicKey: string, memo: string, broadcastTransaction: boolean) => {
  let litNodeClient: LitNodeClient

  try {
    const ethersSigner = new ethers.Wallet(
      ETHEREUM_PRIVATE_KEY,
      new ethers.providers.JsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE),
    )

    console.log('🔄 Connecting to Lit network...')
    litNodeClient = new LitNodeClient({
      litNetwork: LitNetwork.DatilDev,
      debug: false,
    })
    await litNodeClient.connect()
    console.log('✅ Connected to Lit network')

    console.log('🔄 Getting PKP Session Sigs...')
    const pkpSessionSigs = await litNodeClient.getPkpSessionSigs({
      pkpPublicKey,
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
    const wrappedKey = await generateNostrPrivateKey({
      pkpSessionSigs,
      network: 'nostr',
      memo,
      litNodeClient,
    })
    console.log(
      `✅ Generated wrapped key with id: ${wrappedKey.id} and public key: ${wrappedKey.generatedPublicKey}`,
    )

    const unsignedMetadata = {
      name: 'My-Relay-Bot 1',
      about: 'Test-Relay-Bot is a bot for receive a payload from Test-Bot',
      nip05: 'Test-Relay-Bot',
      lud06: 'Test-Relay-Bot',
    }

    console.log('🔄 Signing metadata with Wrapped Key...')
    const verifiedEvent = await signMetadataWithEncryptedKey({
      pkpSessionSigs,
      network: 'nostr',
      id: wrappedKey.id,
      unsignedMetadata,
      broadcast: broadcastTransaction,
      litNodeClient,
    } as unknown as SignMetadataWithEncryptedKeyParams)
    console.log('✅ Signed metadata')

    console.log('🔄 Getting Stored Key metadata...')
    const storedKeyMetadata = await getEncryptedKey({
      pkpSessionSigs,
      id: wrappedKey.id,
      litNodeClient,
    })
    console.log(`✅ Got Stored Key metadata`)

    const accessControlCondition = getPkpAccessControlCondition(storedKeyMetadata.pkpAddress)

    return verifiedEvent
  } catch (error) {
    console.error(error)
  } finally {
    litNodeClient?.disconnect()
  }
}

export async function PushToNostrRelay(
  signedMetadata: VerifiedEvent,
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

  // Write relay list
  const nostr_read_relays = Object.entries(nostr_relays)
    .filter(([_url, r]) => r.read)
    .map(([url, _r]) => url)
  if (!nostr_read_relays.length) nostr_read_relays.push('wss://relay.damus.io')

  await Promise.all(pool.publish(nostr_write_relays, signedMetadata))
  nostr_read_relays.forEach((relay) => {
    nostr_relays[relay] = nostr_write_relays.includes(relay)
      ? { read: true, write: true }
      : { read: true, write: false }
  })

  console.log('✅ published to relay with npub:', npubEncode(signedMetadata.pubkey))

  return nostr_relays
}

export default async function setup() {
  const signedMetadata = await action(PKP_KEY, 'nostr-bot', true)
  console.log(JSON.parse(signedMetadata), 'Metadata Signed!')
  PushToNostrRelay(JSON.parse(signedMetadata)).then(console.log)
  // await Promise.all(pool.publish(nostr_write_relays, JSON.parse(signedMetadata))).then(console.log)
}
