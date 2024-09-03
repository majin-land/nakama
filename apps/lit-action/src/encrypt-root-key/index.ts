/**
 *
 * Signs a message with the Ethers wallet which is also decrypted inside the Lit Action.
 *
 * @jsParam pkpAddress - The Eth address of the PKP which is associated with the Wrapped Key
 * @jsParam ciphertext - For the encrypted Wrapped Key
 * @jsParam dataToEncryptHash - For the encrypted Wrapped Key
 * @jsParam messageToSign - The unsigned message to be signed by the Wrapped Key
 * @jsParam accessControlConditions - The access control condition that allows only the pkpAddress to decrypt the Wrapped Key
 *
 * @returns { Promise<string> } - Returns a message signed by the Ethers Wrapped key. Or returns errors if any.
 */


import { hkdf } from "https://esm.sh/@noble/hashes@1.4.0/hkdf.js";
import { pbkdf2Async } from "https://esm.sh/@noble/hashes@1.4.0/pbkdf2.js";
import { sha512 } from "https://esm.sh/@noble/hashes@1.4.0/sha512.js";
import { finalizeEvent, verifyEvent } from "https://esm.sh/nostr-tools@2.7.2/pure";
import { decrypt as nip04Decrypt, encrypt as nip04Encrypt } from "https://esm.sh/nostr-tools@2.7.2/nip04.js";
// import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.3";
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
import { EncryptedDirectMessage } from "https://esm.sh/nostr-tools/kinds";

import { sha256 } from "https://esm.sh/@noble/hashes@1.4.0/sha256.js";

const LIT_PREFIX = 'lit_';


const go = async () => {

  const SUPABASE_URL = supabase.url // @JSParams supabase.url
  const SUPABASE_SERVICE_ROLE = supabase.serviceRole // @JSParams supabase.anonKey
  const SUPABASE_ADMIN_EMAIL = supabase.email // @JSParams supabase.email
  const SUPABASE_ADMIN_PASSWORD = supabase.password // @JSParams supabase.password

  let supabaseClient

  try {
     // Validate nostr request
  const isValid = verifyEvent(nostrRequest); // @JsParams nostrRequest
  if (!isValid) throw new Error('Invalid nostr request');

  const random = await crypto.getRandomValues(new Uint8Array(32));
  
  const entropies: string[] = await Lit.Actions.broadcastAndCollect({
    name: 'seeds',
    value: ethers.utils.hexlify(random),
  });


  // TODO: convert to mnemonic
  const entropyHex = entropies.sort().reduce((acc, s, idx) => acc + s.slice(2), '0x');
  const entropy = hkdf(sha256, ethers.utils.arrayify(entropyHex), new Uint8Array(32), 'seed', 32);

  // BIP39 Seed
  const password = ''
  const encoder = new TextEncoder();
  const salt = encoder.encode("mnemonic" + password);
  const seed = await pbkdf2Async(sha512, entropy, salt, { c: 2048, dkLen: 64 });

  // BIP32 Root Key
  const rootHDNode = ethers.utils.HDNode.fromSeed(seed);
  const { extendedKey: bip32RootKey } = rootHDNode;
  
  // Safety check ensure all nodes agree on same BIP32 Root Key
  const rootKeyIds: string[] = await Lit.Actions.broadcastAndCollect({
    name: 'response',
    value: sha256(bip32RootKey),
  });

  if (!rootKeyIds.every((id) => id === rootKeyIds[0])) throw new Error(`Node synchronization failed: Expected all responses to be "${rootKeyIds[0]}", but got variations: [${rootKeyIds.join(', ')}]`);

  // BIP32 Derivation Path
  const networkPath = "m/44'/60'/0'/0";

  // BIP32 Extended Private Key
  const networkHDNode = rootHDNode.derivePath(networkPath);
  const { extendedKey: bip32ExtendedPrivateKey } = networkHDNode

  const accounts = [0].map((num) => {
    const path = `${networkPath}/${num}`;
    const hd = rootHDNode.derivePath(path);
    const wallet = new ethers.Wallet(hd);
    const { address, publicKey: publicKeyLong } = wallet;
    return [path, {
      address,
      publicKey: hd.publicKey,
      publicKeyLong,
    }]
  });

  let decryptedPrivateKey;
  try {
    decryptedPrivateKey = await Lit.Actions.decryptToSingleNode({
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
      // TODO: add salt
    // if (!decryptedPrivateKey.startsWith(LIT_PREFIX)) {
    // NOTE: removeSaltFromDecryptedKey and this code cause an error
    // There was an error getting the signing shares from the nodes
    //
    //   throw new Error(
    //     `Error: PKey was not encrypted with salt; all wrapped keys must be prefixed with '${LIT_PREFIX}'`
    //   );
    // }
    // nostrPrivateKey = decryptedPrivateKey.slice(LIT_PREFIX.length);
    // TODO: will remove after noStrBot PrivateKey already setup
    nostrPrivateKey = '0x8df6f7871767956deff0bc2c9bb1d570f1e323ff5bca3ca23079a2fe46efa58a'.slice(2);
  } catch (err) {
    Lit.Actions.setResponse({ response: err.message });
    return;
  }
    
  // Decrypt the content of the nostr request
  const payload = await nip04Decrypt(nostrPrivateKey, nostrRequest.pubkey, nostrRequest.content);
  console.info('Received DM:', payload);

  // https://github.com/LIT-Protocol/js-sdk/blob/d30de12744552d41d1b1d709f737ae8a90d1ce3a/packages/wrapped-keys/src/lib/litActions/solana/src/generateEncryptedSolanaPrivateKey.js#L25
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
  
  const dataToSign = ethers.utils.arrayify(ethers.utils.keccak256(new TextEncoder().encode(userKeystore)));

  const sig = await Lit.Actions.signAndCombineEcdsa({
    toSign: dataToSign,
    publicKey,
    sigName: 'sigSecretKey',
  });

    
  await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'storeEncryptedKeystore' },
    async () => {
      supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
      await supabaseClient.auth.signInWithPassword({
        email: SUPABASE_ADMIN_EMAIL,
        password: SUPABASE_ADMIN_PASSWORD,
      })

      const { data: existedData } = await supabaseClient.from('keystore').select('id').eq('pubkey', nostrRequest.pubkey).single()

    if (existedData) {
      const message =  'You already have a wallet'
      const nostrReply = {
        kind: EncryptedDirectMessage,
        tags: [
          ['p', nostrRequest.pubkey],
        ],
        created_at: Math.floor(Date.now() / 1000),
        content: await nip04Encrypt(nostrPrivateKey, nostrRequest.pubkey, message),
      }

      Lit.Actions.setResponse({ response: JSON.stringify(finalizeEvent(nostrReply, nostrPrivateKey))});
      return
    }

    // Store encrypted keystore
    const { error } = await supabaseClient.from('keystore').insert({
      key: userKeystore,
      signature: sig,
      pubkey: nostrRequest.pubkey
    })

    if (error) throw error
  })

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
      content: await nip04Encrypt(nostrPrivateKey, nostrRequest.pubkey, nostrReplyMessage),
    }
  
    Lit.Actions.setResponse({
      response: JSON.stringify(finalizeEvent(nostrReply, nostrPrivateKey)),
    });

  } catch (error) { 
    Lit.Actions.setResponse({ response: error.message });
  } finally {
    if (supabaseClient) {
      supabaseClient.auth.signOut() 
    }
  }
};

go();