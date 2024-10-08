import {
  AccessControlConditions,
  ILitNodeClient,
  SessionSigsMap,
} from '@lit-protocol/types';

import { postLitActionValidation } from './utils';
import {
  EthereumLitTransaction,
  SerializedTransaction,
  StoredKeyData,
} from '../types';
import { GLOBAL_OVERWRITE_IPFS_CODE_BY_NETWORK } from '@lit-protocol/constants';
import { VerifiedEvent } from 'nostr-tools';

interface SignTransactionWithLitActionParams {
  litNodeClient: ILitNodeClient;
  pkpSessionSigs: SessionSigsMap;
  litActionIpfsCid: string;
  unsignedTransaction: EthereumLitTransaction | SerializedTransaction | VerifiedEvent;
  storedKeyMetadata: StoredKeyData;
  accessControlConditions: AccessControlConditions;
  broadcast: boolean;
  seedCiphertext?: string;
  seedDataToEncryptHash?: string;
}

export async function signTransactionWithLitAction({
  accessControlConditions,
  broadcast,
  litActionIpfsCid,
  litNodeClient,
  pkpSessionSigs,
  storedKeyMetadata: { ciphertext, dataToEncryptHash, pkpAddress },
  unsignedTransaction,
  seedCiphertext,
  seedDataToEncryptHash,
}: SignTransactionWithLitActionParams): Promise<string> {

  const seedEcryptedKey: { ciphertext?: string; dataToEncryptHash?: string } = {}
  if (seedCiphertext && seedDataToEncryptHash) {
    seedEcryptedKey.ciphertext = seedCiphertext 
    seedEcryptedKey.dataToEncryptHash = seedDataToEncryptHash
  }

  const result = await litNodeClient.executeJs({
    sessionSigs: pkpSessionSigs,
    ipfsId: litActionIpfsCid,
    jsParams: {
      pkpAddress,
      ciphertext,
      dataToEncryptHash,
      unsignedTransaction,
      broadcast,
      accessControlConditions,
      ...seedEcryptedKey
    },
    ipfsOptions: {
      overwriteCode:
        GLOBAL_OVERWRITE_IPFS_CODE_BY_NETWORK[litNodeClient.config.litNetwork],
    },
  });

  return postLitActionValidation(result);
}
