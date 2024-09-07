import {
    AccessControlConditions,
    ILitNodeClient,
    SessionSigsMap,
  } from '@lit-protocol/types';
import * as fs from 'fs'
  
  import { postLitActionValidation } from './utils';
  import { NostrEvent, StoredKeyData } from '../types';
  import { GLOBAL_OVERWRITE_IPFS_CODE_BY_NETWORK } from '@lit-protocol/constants';
  
  interface InfoFeatureWithLitActionParams {
    litNodeClient: ILitNodeClient;
    pkpSessionSigs: SessionSigsMap;
    storedKeyMetadata: StoredKeyData;
    accessControlConditions: AccessControlConditions;
    nostrEvent: NostrEvent;
  }

const litActionCode = fs.readFileSync('./apps/lit-action/dist/information-feature.js', 'utf8')

export async function infoFeatureWithLitAction(
  args: InfoFeatureWithLitActionParams
) {
  const {
    accessControlConditions,
    litNodeClient,
    pkpSessionSigs,
    storedKeyMetadata,
    nostrEvent,
  } = args;

  const { pkpAddress, ciphertext, dataToEncryptHash } = storedKeyMetadata;
  const result = await litNodeClient.executeJs({
    sessionSigs: pkpSessionSigs,
    code: litActionCode,
    jsParams: {
      ciphertext,
      dataToEncryptHash,
      accessControlConditions,
      nostrRequest: nostrEvent,
    },
    ipfsOptions: {
      overwriteCode:
        GLOBAL_OVERWRITE_IPFS_CODE_BY_NETWORK[litNodeClient.config.litNetwork],
    },
  });
  return postLitActionValidation(result);
}
  