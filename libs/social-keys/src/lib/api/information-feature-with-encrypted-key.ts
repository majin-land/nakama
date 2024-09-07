import { infoFeatureWithLitAction } from "../lit-actions-client";
import { fetchPrivateKey } from "../service-client";
import { InfoFeatureWithEncryptedKeyParams, SignNostrEventWithEncryptedKeyParams } from "../types";
import { getFirstSessionSig, getPkpAccessControlCondition } from "../utils";

export async function informationFeatureWithEncryptedKey(
    params: any
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

    return infoFeatureWithLitAction({
      ...params,
      storedKeyMetadata,
      accessControlConditions: [allowPkpAddressToDecrypt],
    });
  }