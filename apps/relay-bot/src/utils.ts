import { LIT_NETWORKS_KEYS } from '@lit-protocol/types'
import { LIT_CHAINS } from '@lit-protocol/constants'
import * as ethers from 'ethers'
import { EthereumLitTransaction } from '@lit-protocol/wrapped-keys'

import { SimplePool, finalizeEvent, verifyEvent } from 'nostr-tools'
import { RelayList } from 'nostr-tools/kinds'
import { SignRelayListWithEncryptedKeyParams, api } from '@nakama/social-keys'

const { signRelayListWithEncryptedKey } = api

export function getChainForNetwork(network: LIT_NETWORKS_KEYS): {
  chain: string
  chainId: number
} {
  switch (network) {
    case 'cayenne':
    case 'habanero':
    case 'manzano':
      return {
        chain: 'chronicleTestnet',
        chainId: LIT_CHAINS['chronicleTestnet'].chainId,
      }
    case 'datil-dev':
      return {
        chain: 'yellowstone',
        chainId: LIT_CHAINS['yellowstone'].chainId,
      }
    case 'datil-test':
      return {
        chain: 'yellowstone',
        chainId: LIT_CHAINS['yellowstone'].chainId,
      }
    case 'datil':
      return {
        chain: 'yellowstone',
        chainId: LIT_CHAINS['yellowstone'].chainId,
      }
    default:
      throw new Error(`Cannot identify chain params for ${network}`)
  }
}

export function getGasParamsForNetwork(network: LIT_NETWORKS_KEYS): {
  gasPrice?: string
  gasLimit: number
} {
  switch (network) {
    case 'cayenne':
    case 'habanero':
    case 'manzano':
      return {
        gasPrice: '0.001',
        gasLimit: 30000,
      }
    case 'datil-dev':
      return { gasLimit: 5000000 }
    case 'datil-test':
      return { gasLimit: 5000000 }
    case 'datil':
      return { gasLimit: 5000000 }
    default:
      throw new Error(`Cannot identify chain params for ${network}`)
  }
}

export function getBaseTransactionForNetwork({
  toAddress,
  network,
}: {
  toAddress: string
  network: LIT_NETWORKS_KEYS
}): EthereumLitTransaction {
  return {
    toAddress,
    value: '0.0001', // in ethers (Lit tokens)
    ...getChainForNetwork(network),
    ...getGasParamsForNetwork(network),
    // dataHex: ethers.utils.hexlify(ethers.utils.toUtf8Bytes('Test transaction from Alice to bob')),
    // dataHex: ethers.hexlify(ethers.toUtf8Bytes('Test transaction from Alice to bob')),
  }
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

export const getSignedRelayList = async (pkpSessionSigs, wrappedKey, litNodeClient) => {
  // See: https://github.com/nostr-protocol/nips/blob/master/65.md#when-to-use-read-and-write
  const nostr_write_relays = ['wss://relay.damus.io', 'wss://relay.primal.net']
  const nostr_read_relays = ['wss://relay.damus.io', 'wss://relay.primal.net']

  console.log('🔄 Signing relay list with Wrapped Key...')
  const verifiedRelayList = await signRelayListWithEncryptedKey({
    pkpSessionSigs,
    network: 'nostr',
    id: wrappedKey.id,
    nostr_write_relays,
    nostr_read_relays,
    litNodeClient,
  } as unknown as SignRelayListWithEncryptedKeyParams)
  console.log('✅ Signed relay list')

  return {
    signedRelayList: JSON.parse(verifiedRelayList),
    nostr_write_relays,
    nostr_read_relays,
  }
}
