import * as ethers from 'ethers'
import { LitNodeClient } from '@lit-protocol/lit-node-client'
import { LIT_RPC, LitNetwork } from '@lit-protocol/constants'
import { LitAbility, LitActionResource } from '@lit-protocol/auth-helpers'
import { EthWalletProvider } from '@lit-protocol/lit-auth-client'
import { SimplePool, verifyEvent } from 'nostr-tools'
import { RelayList, EncryptedDirectMessage } from 'nostr-tools/kinds'
import { npubEncode } from 'nostr-tools/nip19'

import {
  api,
  SignNostrEventWithEncryptedKeyParams,
  RegisterUserWalletWithEncryptedKeyParams,
  InfoFeatureWithEncryptedKeyParams,
} from '@nakama/social-keys'

const {
  signNostrEventWithEncryptedKey,
  registerUserWalletWithEncryptedKey,
  informationFeatureWithEncryptedKey,
} = api

// required env
const ETHEREUM_PRIVATE_KEY = process.env.PRIVATE_KEY
const PKP_PUBLIC_KEY = process.env.PKP_PUBLIC_KEY
const WRAPPED_KEY_ID = process.env.RELAY_BOT_WRAPPED_KEY_ID
const WRAPPED_PUB_KEY = process.env.NOSTR_PUBKEY
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_ADMIN_EMAIL = process.env.SUPABASE_ADMIN_EMAIL
const SUPABASE_ADMIN_PASSWORD = process.env.SUPABASE_ADMIN_PASSWORD

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

  const nostr_write_relays = Object.entries(nostr_relays)
    .filter(([_url, r]) => r.write)
    .map(([url, _r]) => url)
  if (!nostr_write_relays.length)
    nostr_write_relays.push('wss://relay.damus.io', 'wss://relay.primal.net')

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
          expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(),
        }),
      ],
      resourceAbilityRequests: [
        {
          resource: new LitActionResource('*'),
          ability: LitAbility.LitActionExecution,
        },
      ],
      expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(),
    })
    console.log('✅ Got PKP Session Sigs')

    console.log('🔄 Getting Relay list...')
    try {
      const relayList = await pool.get(nostr_write_relays, {
        kinds: [RelayList],
        authors: [wrappedPubKey],
      })

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
      console.log(`✅ Got Relay list`)
    } catch (error) {
      console.error('Error fetching relay list:', error)
    }

    // Subscription logic here
    console.log('Listen / Subscribe to DM...')
    try {
      const subDmOnly = pool.subscribeMany(
        Object.keys(nostr_relays),
        [
          {
            kinds: [EncryptedDirectMessage],
            '#p': [wrappedPubKey],
            since: Math.floor(Date.now() / 1000),
          },
        ],
        {
          async onevent(event) {
            try {
              console.info('Received DM:', event)
              if (verifyEvent(event)) {
                if (!litNodeClient.ready) {
                  console.log('🔄 Reconnecting to Lit network before handling the event...')
                  await litNodeClient.connect()
                  console.log('✅ Reconnected to Lit network')
                }
                const verifiedMessage = await signNostrEventWithEncryptedKey({
                  pkpSessionSigs,
                  id: wrappedKeyId,
                  nostrEvent: event,
                  litNodeClient,
                } as unknown as SignNostrEventWithEncryptedKeyParams)
                console.log('✅ Message: ', JSON.parse(verifiedMessage))

                if (verifiedMessage.toLowerCase().includes('register')) {
                  // register lit action call here
                  const register = await registerUserWalletWithEncryptedKey({
                    pkpSessionSigs,
                    id: wrappedKeyId,
                    nostrEvent: event,
                    litNodeClient,
                    publicKey: PKP_PUBLIC_KEY,
                    supabaseUrl: SUPABASE_URL,
                    supabaseServiceRoleKey: SUPABASE_SERVICE_ROLE_KEY,
                    supabaseAdminEmail: SUPABASE_ADMIN_EMAIL,
                    supabaseAdminPassword: SUPABASE_ADMIN_PASSWORD,
                  } as unknown as RegisterUserWalletWithEncryptedKeyParams)

                  if (register) {
                    console.log('✅ New User registered: ', JSON.stringify(register))
                    const content = JSON.parse(register)
                    try {
                      await Promise.all(pool.publish(Object.keys(nostr_relays), content))
                      console.info('✅ Response sent to user:', content)
                    } catch (error) {
                      console.error('Error sending response to user:', error)
                    }
                  }
                }
                if (verifiedMessage.toLowerCase().includes('info')) {
                  // info lit action call here
                  const info = await informationFeatureWithEncryptedKey({
                    pkpSessionSigs,
                    id: wrappedKeyId,
                    nostrEvent: event,
                    litNodeClient,
                  } as unknown as SignNostrEventWithEncryptedKeyParams)

                  if (info) {
                    console.log('✅ Information: ', JSON.stringify(info))
                    const content = JSON.parse(info)
                    try {
                      await Promise.all(pool.publish(Object.keys(nostr_relays), content))
                      console.info('✅ Response sent to show information:', content)
                    } catch (error) {
                      console.error('Error sending response to user:', error)
                    }
                  }
                }
                if (verifiedMessage.toLowerCase().includes('send')) {
                  // send lit action call here
                }
                if (verifiedMessage.toLowerCase().includes('topup')) {
                  // topup lit action call here
                }
              }
            } catch (error) {
              console.error('Error handling event:', error)
            }
          },
        },
      )
      return { pool, subs: [subDmOnly] }
    } catch (error) {
      console.error('Error subscribing to DM:', error)
    }
  } catch (error) {
    console.error('Error in action:', error)
  } finally {
    litNodeClient?.disconnect()
  }
}

export default async function run() {
  await action(PKP_KEY, WRAPPED_PUB_KEY, WRAPPED_KEY_ID)
}
