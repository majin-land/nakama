import {
  signMessageWithEncryptedKey,
  getEncryptedKey,
  exportPrivateKey,
  generatePrivateKey,
  generateNostrPrivateKey,
  importPrivateKey,
  signTransactionWithEncryptedKey,
  storeEncryptedKey,
  listEncryptedKeyMetadata,
  signMetadataWithEncryptedKey,
  signRelayListWithEncryptedKey,
  signNostrEventWithEncryptedKey,
  registerUserWalletWithEncryptedKey,
  sendTransactionWithEncryptedKey,
} from './lib/api'
import {
  CHAIN_ETHEREUM,
  LIT_PREFIX,
  NETWORK_EVM,
  NETWORK_SOLANA,
  KEYTYPE_K256,
  KEYTYPE_ED25519,
} from './lib/constants'

import { getFirstSessionSig, getPkpAccessControlCondition } from './lib/utils'

import {
  getChainForNetwork,
  getGasParamsForNetwork,
  getBaseTransactionForNetwork,
} from './lib/wrapper-keys/utils'

import {
fetchPrivateKey
} from './lib/service-client'

import type { SupportedNetworks } from './lib/service-client/types'
import type {
  SignMessageWithEncryptedKeyParams,
  GetEncryptedKeyDataParams,
  ExportPrivateKeyParams,
  GeneratePrivateKeyParams,
  ImportPrivateKeyParams,
  SignTransactionWithEncryptedKeyParams,
  ExportPrivateKeyResult,
  GeneratePrivateKeyResult,
  EthereumLitTransaction,
  SerializedTransaction,
  BaseApiParams,
  ApiParamsSupportedNetworks,
  SignTransactionParams,
  SignTransactionParamsSupportedEvm,
  SignTransactionParamsSupportedSolana,
  StoreEncryptedKeyParams,
  StoredKeyData,
  StoredKeyMetadata,
  ListEncryptedKeyMetadataParams,
  StoreEncryptedKeyResult,
  ImportPrivateKeyResult,
  NostrMetadata,
  SignMetadataWithEncryptedKeyParams,
  SignRelayListWithEncryptedKeyParams,
  SignNostrEventWithEncryptedKeyParams,
  RegisterUserWalletWithEncryptedKeyParams,
  SendTransactionWithEncryptedKeyParams,
} from './lib/types'
import { signTransactionWithLitAction } from './lib/lit-actions-client'

export const constants = {
  CHAIN_ETHEREUM,
  LIT_PREFIX,
  NETWORK_EVM,
  NETWORK_SOLANA,
  KEYTYPE_K256,
  KEYTYPE_ED25519,
}

export const api = {
  exportPrivateKey,
  generatePrivateKey,
  generateNostrPrivateKey,
  getEncryptedKey,
  listEncryptedKeyMetadata,
  importPrivateKey,
  signMessageWithEncryptedKey,
  signTransactionWithEncryptedKey,
  storeEncryptedKey,
  signMetadataWithEncryptedKey,
  signRelayListWithEncryptedKey,
  fetchPrivateKey,
  signTransactionWithLitAction,
  signNostrEventWithEncryptedKey,
  registerUserWalletWithEncryptedKey,
  sendTransactionWithEncryptedKey,
}

export {
  ApiParamsSupportedNetworks,
  BaseApiParams,
  EthereumLitTransaction,
  ExportPrivateKeyParams,
  ExportPrivateKeyResult,
  GetEncryptedKeyDataParams,
  GeneratePrivateKeyParams,
  GeneratePrivateKeyResult,
  ImportPrivateKeyParams,
  ImportPrivateKeyResult,
  ListEncryptedKeyMetadataParams,
  SerializedTransaction,
  SignTransactionParams,
  SignTransactionParamsSupportedEvm,
  SignTransactionParamsSupportedSolana,
  SignMessageWithEncryptedKeyParams,
  SignTransactionWithEncryptedKeyParams,
  StoreEncryptedKeyParams,
  StoreEncryptedKeyResult,
  StoredKeyData,
  StoredKeyMetadata,
  SupportedNetworks,
  getChainForNetwork,
  getGasParamsForNetwork,
  getBaseTransactionForNetwork,
  NostrMetadata,
  SignMetadataWithEncryptedKeyParams,
  SignRelayListWithEncryptedKeyParams,
  getPkpAccessControlCondition,
  getFirstSessionSig,
  SignNostrEventWithEncryptedKeyParams,
  RegisterUserWalletWithEncryptedKeyParams,
  SendTransactionWithEncryptedKeyParams,
}
