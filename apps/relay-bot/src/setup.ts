import * as ethers from 'ethers'
import { SimplePool } from 'nostr-tools'
import { LitNodeClient } from '@lit-protocol/lit-node-client'
import { LIT_RPC, LitNetwork } from '@lit-protocol/constants'
import { LitAbility, LitActionResource } from '@lit-protocol/auth-helpers'
import { EthWalletProvider } from '@lit-protocol/lit-auth-client'
import { npubEncode } from 'nostr-tools/nip19'

import { api, SignMetadataWithEncryptedKeyParams } from '@nakama/social-keys'
import { getSignedRelayList } from './utils'

const { generateNostrPrivateKey, signMetadataWithEncryptedKey } = api

const ETHEREUM_PRIVATE_KEY = process.env.PRIVATE_KEY
const PKP_PUBLIC_KEY = process.env.PKP_PUBLIC_KEY

const PKP_KEY = `0x${PKP_PUBLIC_KEY}`

export const action = async (
  pkpPublicKey: string,
  memo: string,
  opts: {
    pool?: SimplePool
  } = {},
) => {
  let litNodeClient: LitNodeClient
  const { pool = new SimplePool() } = opts

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
    console.log('wrappedKey', wrappedKey)

    const { signedRelayList, nostr_write_relays } = await getSignedRelayList(
      pkpSessionSigs,
      wrappedKey,
      litNodeClient,
    )

    console.log('🔄 Publishing relay list...')
    try {
      await Promise.all(pool.publish(nostr_write_relays, signedRelayList))
      console.log('✅ Published relay list')
    } catch (error) {
      console.error('Error publishing relay list:', error)
    }

    const unsignedMetadata = {
      bot: true,
      display_name: 'Nakama Relay Bot',
      name: 'Nakama Relay Bot',
      about: 'Nakama Relay Bot is a bot for receive a payload from Test-Bot',
    }

    console.log('🔄 Signing metadata with Wrapped Key...')
    const verifiedMetadata = await signMetadataWithEncryptedKey({
      pkpSessionSigs,
      network: 'nostr',
      id: wrappedKey.id,
      unsignedMetadata,
      litNodeClient,
    } as unknown as SignMetadataWithEncryptedKeyParams)
    console.log('✅ Signed metadata')

    const signedMetadata = JSON.parse(verifiedMetadata)
    console.log('signedMetadata', signedMetadata)

    console.log('🔄 Publishing metadata...')
    try {
      await Promise.all(pool.publish(nostr_write_relays, signedMetadata))
      console.log('✅ Published metadata')
    } catch (error) {
      console.error('Error publishing metadata:', error)
    }

    console.log('✅ published to relay with npub:', npubEncode(signedMetadata.pubkey))
    console.log('✅ published pubkey:', signedMetadata.pubkey)
    return npubEncode(signedMetadata.pubkey)
  } catch (error) {
    console.error(error)
  } finally {
    litNodeClient?.disconnect()
  }
}

export default async function setup() {
  await action(PKP_KEY, 'nostr-bot').then(console.log)
}
