import * as ethers from "ethers"
import { LitNodeClient } from "@lit-protocol/lit-node-client"
import { LIT_RPC, LitNetwork } from "@lit-protocol/constants"
import { LitAbility, LitActionResource } from "@lit-protocol/auth-helpers"
import { EthWalletProvider } from "@lit-protocol/lit-auth-client"
import { SimplePool, verifyEvent } from "nostr-tools"
import { RelayList, EncryptedDirectMessage } from "nostr-tools/kinds"
import { npubEncode } from "nostr-tools/nip19"
import { createClient } from "@supabase/supabase-js"

import {
  api,
  SignNostrEventWithEncryptedKeyParams,
  RegisterUserWalletWithEncryptedKeyParams,
  NostrReplyWithEncryptedKeyParams,
  SendCryptoWithEncryptedKeyParams,
  WalletInfoWithEncryptedKeyParams,
} from "@nakama/social-keys"

const {
  signNostrEventWithEncryptedKey,
  registerUserWalletWithEncryptedKey,
  nostrReplyWithEncryptedKey,
  sendCryptoWithEncryptedKey,
  walletInfoWithEncryptedKey,
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

const getUserKeyStore = async (pubkey) => {
  const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  await supabaseClient.auth.signInWithPassword({
    email: SUPABASE_ADMIN_EMAIL,
    password: SUPABASE_ADMIN_PASSWORD,
  })

  const { data: keystore } = await supabaseClient
    .from("keystore")
    .select("key")
    .eq("pubkey", pubkey)
    .single()

  if (!keystore) {
    throw new Error("No keystore found for the given pubkey")
  }

  return JSON.parse(keystore.key)
}

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

  console.info("✅ Nostr bot run with Npub: ", npubEncode(wrappedPubKey))

  const nostr_write_relays = Object.entries(nostr_relays)
    .filter(([_url, r]) => r.write)
    .map(([url, _r]) => url)
  if (!nostr_write_relays.length)
    nostr_write_relays.push("wss://relay.damus.io", "wss://relay.primal.net")

  try {
    const ethersSigner = new ethers.Wallet(
      ETHEREUM_PRIVATE_KEY,
      new ethers.providers.JsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE),
    )

    console.log("🔄 Connecting to Lit network...")
    litNodeClient = new LitNodeClient({
      litNetwork: LitNetwork.DatilDev,
      debug: false,
    })
    await litNodeClient.connect()
    console.log("✅ Connected to Lit network")

    console.log("🔄 Getting Relay list...")
    try {
      const relayList = await pool.get(nostr_write_relays, {
        kinds: [RelayList],
        authors: [wrappedPubKey],
      })

      relayList.tags
        .filter((tag) => tag[0] === "r")
        .forEach((tag) => {
          if (tag.length === 3) {
            const [, relay, typ] = tag
            if (typ === "read") {
              nostr_relays[relay] = { read: true, write: false }
            } else if (typ === "write") {
              nostr_relays[relay] = { read: false, write: false }
            }
          } else if (tag.length === 2) {
            const [, relay] = tag
            nostr_relays[relay] = { read: true, write: true }
          }
        })
      console.log(`✅ Got Relay list`)
    } catch (error) {
      console.error("Error fetching relay list:", error)
    }

    // Subscription logic here
    console.log("Listen / Subscribe to DM...")
    try {
      const subDmOnly = pool.subscribeMany(
        Object.keys(nostr_relays),
        [
          {
            kinds: [EncryptedDirectMessage],
            "#p": [wrappedPubKey],
            since: Math.floor(Date.now() / 1000),
          },
        ],
        {
          async onevent(event) {
            try {
              console.info("Received DM:", event)

              if (verifyEvent(event)) {
                if (!litNodeClient.ready) {
                  console.log("🔄 Reconnecting to Lit network before handling the event...")
                  await litNodeClient.connect()
                  console.log("✅ Reconnected to Lit network")
                }

                console.log("🔄 Getting PKP Session Sigs...")
                const pkpSessionSigs = await litNodeClient.getPkpSessionSigs({
                  pkpPublicKey,
                  authMethods: [
                    await EthWalletProvider.authenticate({
                      signer: ethersSigner,
                      litNodeClient,
                      expiration: new Date(Date.now() + 1000 * 60 * 14).toISOString(),
                    }),
                  ],
                  resourceAbilityRequests: [
                    {
                      resource: new LitActionResource("*"),
                      ability: LitAbility.LitActionExecution,
                    },
                  ],
                  expiration: new Date(Date.now() + 1000 * 60 * 14).toISOString(),
                })
                console.log("✅ Got PKP Session Sigs")

                const verifiedMessage = await signNostrEventWithEncryptedKey({
                  pkpSessionSigs,
                  id: wrappedKeyId,
                  nostrEvent: event,
                  litNodeClient,
                } as unknown as SignNostrEventWithEncryptedKeyParams)
                console.log("✅ Message: ", JSON.parse(verifiedMessage))

                const command = JSON.parse(verifiedMessage).toLowerCase().trim()
                console.log("command", command)

                if (command == "register") {
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
                    console.log("✅ New User registered: ", JSON.stringify(register))
                    const content = JSON.parse(register)
                    try {
                      await Promise.all(pool.publish(Object.keys(nostr_relays), content))
                      console.info("✅ Response sent to user:", content)
                    } catch (error) {
                      console.error("Error sending response to user:", error)
                    }
                  }
                } else if (command.startsWith("send")) {
                  console.log("🔄 Sending...")
                  const regex = /^send (\d*\.?\d*) of (\w+) via (\w+) chain to (0x[a-fA-F0-9]+)$/

                  const match = command.match(regex)
                  console.log("match", match)
                  if (!match) {
                    console.log("no match")
                    return
                  }

                  const matchedCommand = {
                    amount: match[1],
                    token: match[2] || null, // Optional, could be null if not present
                    chain: match[3],
                    recipient: match[4],
                  }
                  console.log("matchedCommand", matchedCommand)

                  const userKeystore = await getUserKeyStore(event.pubkey)
                  // result lit action call here
                  const txHash = await sendCryptoWithEncryptedKey({
                    pkpSessionSigs,
                    id: wrappedKeyId,
                    litNodeClient,
                    seedCiphertext: userKeystore.seedCiphertext,
                    seedDataToEncryptHash: userKeystore.seedDataToEncryptHash,
                    nostrEvent: event,
                  } as unknown as SendCryptoWithEncryptedKeyParams)

                  if (!txHash) return
                  console.log("✅ TX Hash: ", txHash)

                  const message = `
    Sending ${matchedCommand.amount} ETH
    to ${matchedCommand.recipient}
    via ${matchedCommand.chain} is successful!
    Transaction hash: ${txHash}
                  `
                  // result lit action call here
                  const result = await nostrReplyWithEncryptedKey({
                    pkpSessionSigs,
                    id: wrappedKeyId,
                    litNodeClient,
                    pubkey: event.pubkey,
                    message,
                  } as unknown as NostrReplyWithEncryptedKeyParams)
                  if (result) {
                    const content = JSON.parse(result)
                    try {
                      await Promise.all(pool.publish(Object.keys(nostr_relays), content))
                      console.info("✅ Response sent to show wallet info:", content)
                    } catch (error) {
                      console.error("Error sending response to user:", error)
                    }
                  }
                } else if (command == "wallet") {
                  const userKeystore = await getUserKeyStore(event.pubkey)
                  // result lit action call here
                  const information = await walletInfoWithEncryptedKey({
                    pkpSessionSigs,
                    id: wrappedKeyId,
                    litNodeClient,
                    pubkey: event.pubkey,
                    seedCiphertext: userKeystore.seedCiphertext,
                    seedDataToEncryptHash: userKeystore.seedDataToEncryptHash,
                    chain: "sepolia",
                    nostrEvent: event,
                  } as unknown as WalletInfoWithEncryptedKeyParams)

                  if (!information) return
                  console.log("✅ Wallet Info: ", information)

                  // result lit action call here
                  const result = await nostrReplyWithEncryptedKey({
                    pkpSessionSigs,
                    id: wrappedKeyId,
                    litNodeClient,
                    pubkey: event.pubkey,
                    message: information,
                  } as unknown as NostrReplyWithEncryptedKeyParams)
                  if (result) {
                    const content = JSON.parse(result)
                    try {
                      await Promise.all(pool.publish(Object.keys(nostr_relays), content))
                      console.info("✅ Response sent to show wallet info:", content)
                    } catch (error) {
                      console.error("Error sending response to user:", error)
                    }
                  }
                } else {
                  const infoMessage =
                    "Available commands : \ninfo: Available command for users. (this information list)\nregister: Register a new wallet.\nsend: Send a transaction.\nwallet: Get wallet info and balance.\n"

                  // result lit action call here
                  const result = await nostrReplyWithEncryptedKey({
                    pkpSessionSigs,
                    id: wrappedKeyId,
                    litNodeClient,
                    pubkey: event.pubkey,
                    message: infoMessage,
                  } as unknown as NostrReplyWithEncryptedKeyParams)

                  if (result) {
                    console.log("✅ Information: ", result)
                    const content = JSON.parse(result)
                    try {
                      await Promise.all(pool.publish(Object.keys(nostr_relays), content))
                      console.info("✅ Response sent to show information:", content)
                    } catch (error) {
                      console.error("Error sending response to user:", error)
                    }
                  }
                }
              }
            } catch (error) {
              console.error("Error handling event:", error)
            }
          },
        },
      )
      return { pool, subs: [subDmOnly] }
    } catch (error) {
      console.error("Error subscribing to DM:", error)
    }
  } catch (error) {
    console.error("Error in action:", error)
  } finally {
    litNodeClient?.disconnect()
  }
}

export default async function run() {
  await action(PKP_KEY, WRAPPED_PUB_KEY, WRAPPED_KEY_ID)
}
