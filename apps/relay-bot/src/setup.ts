import * as ethers from 'ethers'
import {
  SimplePool,
} from 'nostr-tools'
import { LitNodeClient } from '@lit-protocol/lit-node-client'
import { LIT_RPC, LitNetwork } from '@lit-protocol/constants'
import { LitAbility, LitActionResource } from '@lit-protocol/auth-helpers'
import { EthWalletProvider } from '@lit-protocol/lit-auth-client'
import { api, SignMetadataWithEncryptedKeyParams, getPkpAccessControlCondition } from '@nakama/social-keys'

import { loadNostrRelayList } from './utils'

const { generateNostrPrivateKey, signMetadataWithEncryptedKey, getEncryptedKey } = api

const ETHEREUM_PRIVATE_KEY = process.env.PRIVATE_KEY
const PKP_PUBLIC_KEY = process.env.PKP_PUBLIC_KEY

const PKP_KEY = `0x${PKP_PUBLIC_KEY}`

export const setup = async (
  pkpPublicKey: string,
  memo: string, 
  broadcastTransaction: boolean,
) => {
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
      name: 'Test-Relay-Bot',
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
    });
    console.log(`✅ Got Stored Key metadata`)

    const accessControlCondition = getPkpAccessControlCondition(storedKeyMetadata.pkpAddress)

    return verifiedEvent
  } catch (error) {
    console.error(error)
  } finally {
    litNodeClient!.disconnect()
  }
}

export default async function setup() {
  const pool = new SimplePool()
  const signedMetadata = await generateWrappedKeyAndSignMetadata(PKP_KEY, 'nostr-bot', true)
  console.log(signedMetadata,'Metadata Signed!')
}
