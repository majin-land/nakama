
// import { verifyEvent, finalizeEvent, nip04 } from "https://esm.sh/nostr-tools@1.13.0";
import { EncryptedDirectMessage } from "https://esm.sh/nostr-tools/kinds";
import { decrypt as nip04Decrypt, encrypt as nip04Encrypt } from "https://esm.sh/nostr-tools@2.7.2/nip04.js";
import { finalizeEvent, verifyEvent } from "https://esm.sh/nostr-tools@2.7.2/pure";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CHAIN_ETHEREUM = 'ethereum' as const;

const LIT_PREFIX = 'lit_';

function removeSaltFromDecryptedKey(decryptedPrivateKey) {
  if (!decryptedPrivateKey.startsWith(LIT_PREFIX)) {
    throw new Error(
      `Error: PKey was not encrypted with salt; all wrapped keys must be prefixed with '${LIT_PREFIX}'`
    );
  }

  return decryptedPrivateKey.slice(LIT_PREFIX.length);
}

/**
 *
 * Generates a random Ethers private key and only allows the provided PKP to to decrypt it
 *
 * @jsParam nostrRequest - The nostr event that contains the request
 * @jsParam pkpAddress - The Eth address of the PKP which is associated with the Wrapped Key
 * @jsParam ciphertext - For the encrypted Nostr Wrapped Key
 * @jsParam dataToEncryptHash - For the encrypted Nostr Wrapped Key
 * @jsParam accessControlConditions - The access control condition that allows only the pkpAddress to decrypt the Wrapped Key
 * @jsParam supabase - { url, anonKey } Storage for encrypted Root key
 *
 * @returns { Promise<string> } - Returns a stringified JSON object with ciphertext & dataToEncryptHash which are the result of the encryption. Also returns the publicKey of the newly generated Ethers Wrapped Key.
 */

(async () => {
  // Validate nostr request
  try {
    const isValid = verifyEvent(nostrRequest); // @JsParams nostrRequest
  if (!isValid) throw new Error('Invalid nostr request');

  // const SUPABASE_URL = supabase.url // @JSParams supabase.url
  // const SUPABASE_ANON_KEY = supabase.anonKey // @JSParams supabase.anonKey

  // const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  
  // Decrypt the encrypted Nostr Wrapped Key
  let decrypted;
  try {
    decrypted = await Lit.Actions.decryptToSingleNode({
      accessControlConditions,
      ciphertext,
      dataToEncryptHash,
      chain: 'ethereum',
      authSig: null,
    });
  } catch (err) {
    const errorMessage =
      'Error: When decrypting to a single node- ' + err.message;
    Lit.Actions.setResponse({ response: errorMessage });
    return;
  }

  let nostrPrivateKey;
  try {
    nostrPrivateKey = removeSaltFromDecryptedKey(decrypted);
  } catch (err) {
    Lit.Actions.setResponse({ response: err.message });
    return;
  }
  
  // Decrypt the content of the nostr request
  // const payload = await nip04Decrypt(nostrPrivateKey, nostrRequest.pubkey, nostrRequest.content);
  // console.info('Received DM:', payload);
  
  // if (payload.startsWith('register')) throw new Error('Invalid nostr request');

  // Generate a random 32 byte entropy on each node
  const random = crypto.getRandomValues(new Uint8Array(32));
  const entropies: string[] = await Lit.Actions.broadcastAndCollect({
    name: 'entropies',
    value: ethers.utils.hexlify(random),
  });

  // BIP39 mnemonic
  const entropyHex = entropies.sort().reduce((acc, s, idx) => acc + s.slice(2), '0x');
  const entropy = hkdf(sha256, ethers.utils.arrayify(entropyHex), new Uint8Array(32), 'entropy', 32);
  const mnemonic = ethers.utils.entropyToMnemonic(entropy);

  // BIP39 seed
  const password = '';
  const seed = ethers.utils.mnemonicToSeed(mnemonic, password);

  // BIP32 root Key
  const rootHDNode = ethers.utils.HDNode.fromSeed(seed);
  const { extendedKey: bip32RootKey } = rootHDNode;

  // Safety check ensure all nodes agree on same BIP32 Root Key
  const rootKeyIds: string[] = await Lit.Actions.broadcastAndCollect({
    name: 'rootKeyIds',
    value: ethers.utils.sha256(bip32RootKey),
  });
  if (!rootKeyIds.every((id) => id === rootKeyIds[0])) throw new Error(`Node synchronization failed: Expected all responses to be "${rootKeyIds[0]}", but got variations: [${rootKeyIds.join(', ')}]`);

  // BIP32 Derivation Path for Ethereum network
  const networkPath = "m/44'/60'/0'/0";

  // BIP32 Extended Private Key
  const networkHDNode = rootHDNode.derivePath(networkPath);
  const { extendedKey: bip32ExtendedPrivateKey } = networkHDNode

  // Generate a few accounts
  const accounts = [0].map((num) => {
    const path = `${networkPath}/${num}`;
    const hd = rootHDNode.derivePath(path);
    const wallet = new ethers.Wallet(hd);
    const { address, publicKey: publicKeyLong } = wallet;
    return [path, {
      address,
      publicKey: hd.publicKey,
      publicKeyLong,
    }] as const
  });

  accessControlConditions ||= {
    contractAddress: '',
    standardContractType: '',
    chain: CHAIN_ETHEREUM,
    method: '',
    parameters: [':userAddress'],
    returnValueTest: {
      comparator: '=',
      value: pkpAddress, // @JsParams pkpAddress
    },
  };

  const LIT_PREFIX = 'lit_';

  const userKeystore = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'encryptedPrivateKey' },
    async () => {
      let utf8Encode = new TextEncoder();

      const { ciphertext: seedCiphertext, dataToEncryptHash: seedDataToEncryptHash } = await Lit.Actions.encrypt({
        accessControlConditions,
        to_encrypt: utf8Encode.encode(LIT_PREFIX + seed),
      });

      const { ciphertext: entropyCiphertext, dataToEncryptHash: entropyDataToEncryptHash } = await Lit.Actions.encrypt({
        accessControlConditions,
        to_encrypt: utf8Encode.encode(LIT_PREFIX + entropy),
      });

      return JSON.stringify({
        pubkey: nostrRequest.pubkey,
        seedCiphertext,
        seedDataToEncryptHash,
        entropyCiphertext,
        entropyDataToEncryptHash,
      });
    }
  );

  // Signature for Encrypted privatekey
  const toSign = ethers.utils.arrayify(ethers.utils.keccak256(new TextEncoder().encode(userKeystore)));
  const signature = await Lit.Actions.signAndCombineEcdsa({
    toSign,
    publicKey, // @JsParams publicKey
    sigName: 'sigSecretKey',
  });
  
  const keystore = JSON.stringify(userKeystore)
  // Store private data
  // const { error } = await supabase.from('user_key').insert({
  //   keystore,
  //   signature,
  //   pubkey: keystore.pubkey
  // })

  // if (!error) throw error
  console.log(keystore, 'keystore')
  // await fetch(url, {
  //   method: "POST", // Specify the request method
  //   headers: {
  //     "Content-Type": "application/json" // Set the content type to JSON
  //   },
  //   body: JSON.stringify({ userKeystore, sig }) // Convert the data object to a JSON string
  // })

  // Create a nostr EncryptedDirectMessage
  const nostrReplyMessage = accounts.reduce((acc, [path, account]) => {
    if (path.startsWith("m/44'/60'/")) {
      return acc + `Ethereum account [${path}]: ${account.address}\n`
    } else {
      return acc + `BIP32 address [${path}]: ${account.address}\n`
    }
  }, 'You have been registered on the Lit Protocol!\n\n');
  const nostrReply = {
    kind: EncryptedDirectMessage,
    tags: [
      ['p', nostrRequest.pubkey],
    ],
    created_at: Math.floor(Date.now() / 1000),
    content: nip04Encrypt(nostrPrivateKey, nostrRequest.pubkey, nostrReplyMessage),
  }

    Lit.Actions.setResponse({
      response: JSON.stringify(finalizeEvent(nostrReply, nostrPrivateKey)),
    });
  } catch (error) {
    Lit.Actions.setResponse({
      response: error.message,
    });
  } finally {
    // supabase disconnect
  }
})();
