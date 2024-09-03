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
import { decrypt } from "https://esm.sh/nostr-tools@2.7.2/nip04.js";
// import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.3";
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

import { sha256 } from "https://esm.sh/@noble/hashes@1.4.0/sha256.js";

const LIT_PREFIX = 'lit_';

// const removeSaltFromDecryptedKey = (_decryptedPrivateKey: string) => {
//   if (!_decryptedPrivateKey.startsWith(LIT_PREFIX)) {
//     throw new Error(
//       `Error: PKey was not encrypted with salt; all wrapped keys must be prefixed with '${LIT_PREFIX}'`
//     );
//   }

//   return _decryptedPrivateKey.slice(LIT_PREFIX.length);
// }

const go = async () => {

  const SUPABASE_URL = supabase.url // @JSParams supabase.url
  const SUPABASE_SERVICE_ROLE = supabase.serviceRole // @JSParams supabase.anonKey

  const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

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
    nostrPrivateKey = decryptedPrivateKey.slice(LIT_PREFIX.length);
    // nostrPrivateKey = decryptedPrivateKey;
  } catch (err) {
    Lit.Actions.setResponse({ response: err.message });
    return;
  }

  console.log(nostrPrivateKey, 'nostrPrivateKey')


  // console.log('nostrPrivateKey ddddddddd', nostrPrivateKey, 'decryptedPrivateKey')
  // const payload = await decrypt(nostrPrivateKey.slice(2), nostrRequest.pubkey, nostrRequest.content);
  // console.log('nostrRequest', nostrRequest)
  // console.log('payload', payload)

  // console.log(decryptedPrivateKey, 'decrypteddecrypted')

  // https://github.com/LIT-Protocol/js-sdk/blob/d30de12744552d41d1b1d709f737ae8a90d1ce3a/packages/wrapped-keys/src/lib/litActions/solana/src/generateEncryptedSolanaPrivateKey.js#L25
  const keystore = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'encryptedPrivateKey' },
    async () => {
      
        const utf8Encode = new TextEncoder();
        
        const { ciphertext: ciphertextRootKey, dataToEncryptHash: dataToEncryptHashRootKey } = await Lit.Actions.encrypt({
          accessControlConditions,
          to_encrypt: utf8Encode.encode(bip32RootKey) // Data to encrypt (encoded private key)
        });
      
        // TODO: Store this data to ceramics 
        const userSecret = JSON.stringify({
          encryptedBip32RootKey: {
            ciphertext: ciphertextRootKey,
            dataToEncryptHash: dataToEncryptHashRootKey
          },
          accounts,
          // npub: nostrRequest.pubkey,
        })

        return userSecret
    }
  )
  
  // const toSign = ethers.utils.arrayify(ethers.utils.keccak256(new TextEncoder().encode('keystore')));
  // // console.log(JSON.stringify(toSign), 'jjjjjjjjjjjjjjjjjjjjjjjj')
  // // const toSign = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(keystore)));
  // const signature = await Lit.Actions.signAndCombineEcdsa({
  // // const signature = await Lit.Actions.signEcdsa({
  //   toSign,
  //   publicKey,
  //   sigName: 'sigSecretKeyl',
  // });

  const dataToSign = ethers.utils.arrayify(ethers.utils.keccak256(new TextEncoder().encode(keystore)));

  const sig = await Lit.Actions.signAndCombineEcdsa({
    toSign: dataToSign,
    publicKey,
    sigName: 'sigSecretKey',
  });

  console.log(JSON.stringify(sig), 'sig')

  // const jsonSignature = JSON.parse(signature);
  // jsonSignature.r = "0x" + jsonSignature.r.substring(2);
  // jsonSignature.s = "0x" + jsonSignature.s;
  // const hexSignature = ethers.utils.joinSignature(jsonSignature);

  // console.log('hexSignature', hexSignature)
  await supabaseClient.auth.signInWithPassword({
    email: supabase.email,
    password: supabase.password,
  })

  const { error } = await supabaseClient.from('keystore').insert({
    key: keystore,
    signature: {},
    pubkey: nostrRequest.pubkey
  })

  if (error) throw error

  // const signedTx = ethers.utils.serializeTransaction(
  //   unsignedTransaction,
  //   hexSignature
  // );

  // const recoveredAddress = ethers.utils.recoverAddress(toSign, hexSignature);
  // console.log("HexSignature:", hexSignature);

  

// console.log(signedTx, 'signedTx')
  const response = JSON.stringify({
    // entropy: ethers.utils.hexlify(entropy),
    // bip39Seed: ethers.utils.hexlify(seed),
    // bip32RootKey,
    // bip32ExtendedPrivateKey,
    accounts,
  })

  Lit.Actions.setResponse({ response });
  } catch (error) { 
    Lit.Actions.setResponse({ response: error.message });
  } finally {
    supabaseClient.auth.signOut() 
  }
};

go();