import * as ethers from 'ethers'
import { LitNodeClient } from '@lit-protocol/lit-node-client'
import { LIT_RPC, LitNetwork } from '@lit-protocol/constants'
import { LitAbility, LitActionResource } from '@lit-protocol/auth-helpers'
import { EthWalletProvider } from '@lit-protocol/lit-auth-client'
import { SimplePool, verifyEvent } from 'nostr-tools'
import { RelayList, EncryptedDirectMessage } from 'nostr-tools/kinds'
import { npubEncode } from 'nostr-tools/nip19'

import { api, SignNostrEventWithEncryptedKeyParams } from '@nakama/social-keys'

const { signNostrEventWithEncryptedKey } = api

const ETHEREUM_PRIVATE_KEY = process.env.PRIVATE_KEY
const PKP_PUBLIC_KEY = process.env.PKP_PUBLIC_KEY
const WRAPPED_KEY_ID = process.env.RELAY_BOT_WRAPPED_KEY_ID
const WRAPPED_PUB_KEY = process.env.NOSTR_PUBKEY

const PKP_KEY = `0x${PKP_PUBLIC_KEY}`

export const action = async (
  pkpPublicKey: string,
  wrappedPubKey: string,
  wrappedKeyId: string,
  opts: {
    pool?: SimplePool
    nostr_relays?: { [url: string]: { read: boolean; write: boolean } }
  } = {},
) => {
  let litNodeClient: LitNodeClient
  const { pool = new SimplePool(), nostr_relays = {} } = opts

  console.info('✅ Nostr bot run with Npub: ', npubEncode(wrappedPubKey))

  // See: https://github.com/nostr-protocol/nips/blob/master/65.md#when-to-use-read-and-write
  const nostr_write_relays = Object.entries(nostr_relays)
    .filter(([_url, r]) => r.write)
    .map(([url, _r]) => url)
  if (!nostr_write_relays.length) nostr_write_relays.push('wss://relay.damus.io')

  console.log(nostr_write_relays)

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

    console.log('🔄 Getting Relay list...')
    const relayList = await pool.get(nostr_write_relays, {
      kinds: [RelayList],
      authors: [wrappedPubKey],
    })
    console.log(`✅ Got Relay list`)

    relayList.tags
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

    console.log('Listen / Subscribe to DM...')
    const subDmOnly = pool.subscribeMany(
      Object.keys(nostr_relays),
      [
        {
          kinds: [EncryptedDirectMessage], // DMs
          '#p': [wrappedPubKey], // only want DMs for us
          since: Math.floor(Date.now() / 1000), // only want DMs since now
        },
      ],
      {
        async onevent(event) {
          console.info('Received DM:', event)
          if (verifyEvent(event)) {
            console.log('🔄 Getting message with message handler...')
            const verifiedMessage = await signNostrEventWithEncryptedKey({
              pkpSessionSigs,
              network: 'nostr',
              id: wrappedKeyId,
              nostrEvent: event,
              litNodeClient,
            } as unknown as SignNostrEventWithEncryptedKeyParams)
            console.log('✅ Message: ', JSON.parse(verifiedMessage))
          }

        //   (info) {
        //     1. register
        //     2. send transaction
        //     3. top up
        //     4. voucer
        //   }
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

  } catch (error) {
    console.error(error)
  } finally {
    litNodeClient?.disconnect()
  }
}

export default async function run() {
  await action(PKP_KEY, WRAPPED_PUB_KEY, WRAPPED_KEY_ID)
}
