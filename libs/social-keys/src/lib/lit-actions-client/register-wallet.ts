import {
  AccessControlConditions,
  ILitNodeClient,
  SessionSigsMap,
} from '@lit-protocol/types';

import { postLitActionValidation } from './utils';
import { NostrEvent, StoredKeyData } from '../types';
import { GLOBAL_OVERWRITE_IPFS_CODE_BY_NETWORK } from '@lit-protocol/constants';
import * as fs from 'fs'

const litActionCode = fs.readFileSync('./apps/lit-action/dist/encrypt-root-key.js', 'utf8')

interface RegisterUserWalletWithLitActionParams {
  litNodeClient: ILitNodeClient;
  pkpSessionSigs: SessionSigsMap;
  nostrEvent: NostrEvent;
  storedKeyMetadata: StoredKeyData;
  accessControlConditions: AccessControlConditions;
  publicKey: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  supabaseAdminEmail: string;
  supabaseAdminPassword: string;
}

export async function registerUserWalletWithLitAction(
  args: RegisterUserWalletWithLitActionParams
) {
  const {
    accessControlConditions,
    litNodeClient,
    nostrEvent,
    pkpSessionSigs,
    storedKeyMetadata,
    publicKey,
    supabaseUrl,
    supabaseServiceRoleKey,
    supabaseAdminEmail,
    supabaseAdminPassword,
  } = args;

  const { pkpAddress, ciphertext, dataToEncryptHash } = storedKeyMetadata;
  const result = await litNodeClient.executeJs({
    sessionSigs: pkpSessionSigs,
    // ipfsId: litActionIpfsCid,
    code: litActionCode,
    jsParams: {
      pkpAddress,
      ciphertext,
      dataToEncryptHash,
      nostrEvent,
      accessControlConditions,
      publicKey,
      nostrRequest: nostrEvent,
      supabase: {
        url: supabaseUrl,
        serviceRole: supabaseServiceRoleKey,
        email: supabaseAdminEmail,
        password: supabaseAdminPassword,
      },
    },
    ipfsOptions: {
      overwriteCode:
        GLOBAL_OVERWRITE_IPFS_CODE_BY_NETWORK[litNodeClient.config.litNetwork],
    },
  });
  return postLitActionValidation(result);
}
