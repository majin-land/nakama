import { AccessControlConditions, ILitNodeClient, SessionSigsMap } from '@lit-protocol/types'
import * as fs from 'fs'

import { postLitActionValidation } from './utils'
import { StoredKeyData } from '../types'
import { GLOBAL_OVERWRITE_IPFS_CODE_BY_NETWORK } from '@lit-protocol/constants'

interface NostrReplyWithLitActionParams {
  litNodeClient: ILitNodeClient
  pkpSessionSigs: SessionSigsMap
  storedKeyMetadata: StoredKeyData
  accessControlConditions: AccessControlConditions
  pubkey: string
  message: string
}

const litActionCode = fs.readFileSync('./apps/lit-action/dist/encrypt-nostr-msg.js', 'utf8')

export async function nostrReplyWithLitAction(args: NostrReplyWithLitActionParams) {
  const {
    accessControlConditions,
    litNodeClient,
    pkpSessionSigs,
    storedKeyMetadata,
    pubkey,
    message,
  } = args

  const { ciphertext, dataToEncryptHash } = storedKeyMetadata

  const result = await litNodeClient.executeJs({
    sessionSigs: pkpSessionSigs,
    code: litActionCode,
    jsParams: {
      ciphertext,
      dataToEncryptHash,
      accessControlConditions,
      pubkey,
      message,
    },
    ipfsOptions: {
      overwriteCode: GLOBAL_OVERWRITE_IPFS_CODE_BY_NETWORK[litNodeClient.config.litNetwork],
    },
  })
  return postLitActionValidation(result)
}
