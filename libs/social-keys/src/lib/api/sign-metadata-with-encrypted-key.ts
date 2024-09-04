import { signMetadataWithLitAction } from '../lit-actions-client';
import { getLitActionCid } from '../lit-actions-client/utils';
import { fetchPrivateKey } from '../service-client';
import { SignMetadataWithEncryptedKeyParams } from '../types';
import { getFirstSessionSig, getPkpAccessControlCondition } from '../utils';

/**
 * Signs a transaction inside the Lit Action using the previously persisted wrapped key associated with the current LIT PK.
 * This method fetches the encrypted key from the wrapped keys service, then executes a Lit Action that decrypts the key inside the LIT action and uses
 * the decrypted key to sign the provided transaction
 * Optionally, if you pass `broadcast: true`, the LIT action will also submit the signed transaction to the associated RPC endpoint on your behalf
 *
 * @param { SignMetadataWithEncryptedKeyParams } params Parameters required to sign the requested transaction
 *
 * @returns { string } The signed transaction OR its transaction hash if you set `broadcast: true` and the LIT action supports this functionality.
 */
export async function signMetadataWithEncryptedKey(
  params: SignMetadataWithEncryptedKeyParams
): Promise<string> {
  const { litNodeClient, pkpSessionSigs, id } = params;
  const sessionSig = getFirstSessionSig(pkpSessionSigs);

  const storedKeyMetadata = await fetchPrivateKey({
    id,
    sessionSig,
    litNetwork: litNodeClient.config.litNetwork,
  });

  const allowPkpAddressToDecrypt = getPkpAccessControlCondition(
    storedKeyMetadata.pkpAddress
  );

  return signMetadataWithLitAction({
    ...params,
    litActionIpfsCid: getLitActionCid('nostr', 'signMessage'),
    storedKeyMetadata,
    accessControlConditions: [allowPkpAddressToDecrypt],
  });
}
