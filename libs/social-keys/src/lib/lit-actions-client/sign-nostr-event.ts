import {
  AccessControlConditions,
  ILitNodeClient,
  SessionSigsMap,
} from '@lit-protocol/types';

import { postLitActionValidation } from './utils';
import { NostrEvent, StoredKeyData } from '../types';
import { GLOBAL_OVERWRITE_IPFS_CODE_BY_NETWORK } from '@lit-protocol/constants';

interface SignNostrEventWithLitActionParams {
  litNodeClient: ILitNodeClient;
  pkpSessionSigs: SessionSigsMap;
  litActionIpfsCid: string;
  nostrEvent: NostrEvent;
  storedKeyMetadata: StoredKeyData;
  accessControlConditions: AccessControlConditions;
}

export async function signNostrEventWithLitAction(
  args: SignNostrEventWithLitActionParams
) {
  const {
    accessControlConditions,
    litNodeClient,
    nostrEvent,
    pkpSessionSigs,
    litActionIpfsCid,
    storedKeyMetadata,
  } = args;

  const { pkpAddress, ciphertext, dataToEncryptHash } = storedKeyMetadata;
  const result = await litNodeClient.executeJs({
    sessionSigs: pkpSessionSigs,
    ipfsId: litActionIpfsCid,
    jsParams: {
      pkpAddress,
      ciphertext,
      dataToEncryptHash,
      nostrEvent,
      accessControlConditions,
    },
    ipfsOptions: {
      overwriteCode:
        GLOBAL_OVERWRITE_IPFS_CODE_BY_NETWORK[litNodeClient.config.litNetwork],
    },
  });
  return postLitActionValidation(result);
}
