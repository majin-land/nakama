import {
  AccessControlConditions,
  ILitNodeClient,
  SessionSigsMap,
} from '@lit-protocol/types';

import { postLitActionValidation } from './utils';
import {
  StoredKeyData,
  NostrEvent
} from '../types';
import { GLOBAL_OVERWRITE_IPFS_CODE_BY_NETWORK } from '@lit-protocol/constants';
import * as fs from 'fs'

const LASendTransaction = fs.readFileSync('./apps/lit-action/dist/sign-transaction.js', 'utf8')

interface SendTransactionWithLitActionParams {
  litNodeClient: ILitNodeClient;
  pkpSessionSigs: SessionSigsMap;
  unsignedTransaction: NostrEvent;
  storedKeyMetadata: StoredKeyData;
  accessControlConditions: AccessControlConditions;
  broadcast: boolean;
  publicKey: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  supabaseAdminEmail: string;
  supabaseAdminPassword: string;
}

export async function sendTransactionWithLitAction({
  accessControlConditions,
  broadcast,
  litNodeClient,
  pkpSessionSigs,
  storedKeyMetadata: { ciphertext, dataToEncryptHash, pkpAddress },
  unsignedTransaction,
  publicKey,
  supabaseUrl,
  supabaseServiceRoleKey,
  supabaseAdminEmail,
  supabaseAdminPassword,
}: SendTransactionWithLitActionParams): Promise<string> {

  const result = await litNodeClient.executeJs({
    sessionSigs: pkpSessionSigs,
    // ipfsId: litActionIpfsCid,
    code: LASendTransaction,
    jsParams: {
      publicKey,
      pkpAddress,
      ciphertext,
      dataToEncryptHash,
      unsignedTransaction,
      broadcast,
      accessControlConditions,
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
