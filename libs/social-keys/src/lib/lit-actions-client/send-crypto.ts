import { AccessControlConditions, ILitNodeClient, SessionSigsMap } from '@lit-protocol/types'
import * as fs from 'fs'

import { postLitActionValidation } from './utils'
import { NostrEvent, StoredKeyData } from '../types'
import { GLOBAL_OVERWRITE_IPFS_CODE_BY_NETWORK } from '@lit-protocol/constants'

interface SendCryptoWithLitActionParams {
  litNodeClient: ILitNodeClient
  pkpSessionSigs: SessionSigsMap
  storedKeyMetadata: StoredKeyData
  accessControlConditions: AccessControlConditions
  seedCiphertext: string
  seedDataToEncryptHash: string
  nostrEvent: NostrEvent
}

const litActionCode = fs.readFileSync('./apps/lit-action/dist/eth-transfer.js', 'utf8')

export async function sendCryptoWithLitAction(args: SendCryptoWithLitActionParams) {
  const {
    accessControlConditions,
    litNodeClient,
    pkpSessionSigs,
    storedKeyMetadata,
    seedCiphertext,
    seedDataToEncryptHash,
    nostrEvent,
  } = args

  const { ciphertext, dataToEncryptHash } = storedKeyMetadata

  const jsParams = {
    ciphertext,
    dataToEncryptHash,
    accessControlConditions,
    seedCiphertext,
    seedDataToEncryptHash,
    nostrEvent,
  }

  console.log('jsParams', jsParams)

  const result = await litNodeClient.executeJs({
    sessionSigs: pkpSessionSigs,
    code: litActionCode,
    jsParams,
    ipfsOptions: {
      overwriteCode: GLOBAL_OVERWRITE_IPFS_CODE_BY_NETWORK[litNodeClient.config.litNetwork],
    },
  })
  return postLitActionValidation(result)
}
