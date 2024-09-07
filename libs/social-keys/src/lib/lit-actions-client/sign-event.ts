import { AccessControlConditions, ILitNodeClient, SessionSigsMap } from '@lit-protocol/types'

import { postLitActionValidation } from './utils'
import {
  EthereumLitTransaction,
  NostrMetadata,
  NostrRelays,
  SerializedTransaction,
  StoredKeyData,
} from '../types'
import { GLOBAL_OVERWRITE_IPFS_CODE_BY_NETWORK } from '@lit-protocol/constants'

interface SignMetadataWithLitActionParams {
  litNodeClient: ILitNodeClient
  pkpSessionSigs: SessionSigsMap
  litActionIpfsCid: string
  unsignedMetadata: NostrMetadata
  storedKeyMetadata: StoredKeyData
  accessControlConditions: AccessControlConditions
}
interface SignRelayListWithLitActionParams {
  litNodeClient: ILitNodeClient
  pkpSessionSigs: SessionSigsMap
  litActionIpfsCid: string
  nostr_write_relays: NostrRelays
  nostr_read_relays: NostrRelays
  storedKeyMetadata: StoredKeyData
  accessControlConditions: AccessControlConditions
}

export async function signMetadataWithLitAction({
  accessControlConditions,
  litActionIpfsCid,
  litNodeClient,
  pkpSessionSigs,
  storedKeyMetadata: { ciphertext, dataToEncryptHash, pkpAddress },
  unsignedMetadata,
}: SignMetadataWithLitActionParams): Promise<string> {
  const result = await litNodeClient.executeJs({
    sessionSigs: pkpSessionSigs,
    ipfsId: litActionIpfsCid,
    jsParams: {
      pkpAddress,
      ciphertext,
      dataToEncryptHash,
      unsignedMetadata,
      accessControlConditions,
    },
    ipfsOptions: {
      overwriteCode: GLOBAL_OVERWRITE_IPFS_CODE_BY_NETWORK[litNodeClient.config.litNetwork],
    },
  })

  return postLitActionValidation(result)
}

export async function signRelayListWithLitAction({
  accessControlConditions,
  litActionIpfsCid,
  litNodeClient,
  pkpSessionSigs,
  storedKeyMetadata: { ciphertext, dataToEncryptHash, pkpAddress },
  nostr_write_relays,
  nostr_read_relays,
}: SignRelayListWithLitActionParams): Promise<string> {
  const result = await litNodeClient.executeJs({
    sessionSigs: pkpSessionSigs,
    ipfsId: litActionIpfsCid,
    jsParams: {
      pkpAddress,
      ciphertext,
      dataToEncryptHash,
      nostr_write_relays,
      nostr_read_relays,
      accessControlConditions,
    },
    ipfsOptions: {
      overwriteCode: GLOBAL_OVERWRITE_IPFS_CODE_BY_NETWORK[litNodeClient.config.litNetwork],
    },
  })

  return postLitActionValidation(result)
}
