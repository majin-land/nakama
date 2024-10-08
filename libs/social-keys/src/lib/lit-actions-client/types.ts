import { Network, BaseApiParams } from '../types'

export type LitActionType =
  | 'signTransaction'
  | 'signMessage'
  | 'generateEncryptedKey'
  | 'exportPrivateKey'
  | 'signRelayList'
  | 'messageHandler'
  | 'signMetadata'
  | 'register'

export type LitCidRepositoryEntry = Readonly<Record<Network, string>>

export type LitCidRepository = Readonly<Record<LitActionType, LitCidRepositoryEntry>>

export type ClaimKeyParams = BaseApiParams & {
  pkpPublicKey: string
}
