import {
  AccessControlConditions,
  ILitNodeClient,
  SessionSigsMap,
} from '@lit-protocol/types';

import { postLitActionValidation } from './utils';
import {
  EthereumLitTransaction,
  NostrMetadata,
  SerializedTransaction,
  StoredKeyData,
} from '../types';
import { GLOBAL_OVERWRITE_IPFS_CODE_BY_NETWORK } from '@lit-protocol/constants';

interface SignMetadataWithLitActionParams {
  litNodeClient: ILitNodeClient;
  pkpSessionSigs: SessionSigsMap;
  litActionIpfsCid: string;
  unsignedMetadata: NostrMetadata;
  storedKeyMetadata: StoredKeyData;
  accessControlConditions: AccessControlConditions;
  broadcast: boolean;
}

export async function signMetadataWithLitAction({
  accessControlConditions,
  broadcast,
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
      broadcast,
      accessControlConditions,
    },
    ipfsOptions: {
      overwriteCode:
        GLOBAL_OVERWRITE_IPFS_CODE_BY_NETWORK[litNodeClient.config.litNetwork],
    },
  });

  return postLitActionValidation(result);
}
