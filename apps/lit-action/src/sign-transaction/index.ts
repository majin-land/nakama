// const { removeSaltFromDecryptedKey } = require('../utils');

import { finalizeEvent, verifyEvent } from "https://esm.sh/nostr-tools@2.7.2/pure";
import { decrypt as nip04Decrypt, encrypt as nip04Encrypt } from "https://esm.sh/nostr-tools@2.7.2/nip04.js";
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const LIT_PREFIX = 'lit_' as const;


// function removeSaltFromDecryptedKey(decryptedPrivateKey) {
//   if (!decryptedPrivateKey.startsWith(LIT_PREFIX)) {
//     throw new Error(
//       `Error: PKey was not encrypted with salt; all wrapped keys must be prefixed with '${LIT_PREFIX}'`
//     );
//   }

//   return decryptedPrivateKey.slice(LIT_PREFIX.length);
// }


/**
 *
 * Signs a transaction with the Ethers wallet whose private key is decrypted inside the Lit Action.
 *
 * @jsParam nostrRequest - The nostr event that contains the request
 * @jsParam pkpAddress - The Eth address of the PKP which is associated with the Wrapped Key
 * @jsParam ciphertext - For the encrypted Wrapped Key
 * @jsParam dataToEncryptHash - For the encrypted Wrapped Key
 * @jsParam unsignedTransaction - The unsigned message to be signed by the Wrapped Key
 * @jsParam broadcast - Flag used to determine whether to just sign the message or also to broadcast it using the node's RPC. Note, if the RPC doesn't exist for the chain then the Lit Action will throw an unsupported error.
 * @jsParam accessControlConditions - The access control condition that allows only the pkpAddress to decrypt the Wrapped Key
 * @jsParam supabase - { url, anonKey } Storage for encrypted Root key
*
* @returns { Promise<string> } - Returns the transaction hash if broadcast is set as true else returns only the signed transaction. Or returns errors if any.
 */
(async () => {
  // Validate nostr request
  try {
    const isValid = verifyEvent(nostrRequest); // @JsParams nostrRequest
    if (!isValid) throw new Error('Invalid nostr request');
    
    const SUPABASE_URL = supabase.url; // @JSParams supabase.url
    const SUPABASE_SERVICE_ROLE = supabase.serviceRole; // @JSParams supabase.serviceRole
    const SUPABASE_ADMIN_EMAIL = supabase.email; // @JSParams supabase.email
    const SUPABASE_ADMIN_PASSWORD = supabase.password; // @JSParams supabase.password

    let supabaseClient;

      // encryptedKeyFromStore.

    // const encryptedKeyFromStore 

    if (!unsignedTransaction.to) {
      Lit.Actions.setResponse({
        response: 'Error: Missing required field: to',
      });
      return;
    }

    if (!unsignedTransaction.chain) {
      Lit.Actions.setResponse({
        response: 'Error: Missing required field: chain',
      });
      return;
    }

    if (!unsignedTransaction.value) {
      Lit.Actions.setResponse({
        response: 'Error: Missing required field: value',
      });
      return;
    }

    if (!unsignedTransaction.chainId) {
      Lit.Actions.setResponse({
        response: 'Error: Missing required field: chainId',
      });
      return;
    }

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

    if (!decryptedPrivateKey) {
      // Exit the nodes which don't have the decryptedData
      return;
    }

    let nostrPrivateKey;
    try {
      // nostrPrivateKey = removeSaltFromDecryptedKey(decryptedPrivateKey);
      nostrPrivateKey = '0x8df6f7871767956deff0bc2c9bb1d570f1e323ff5bca3ca23079a2fe46efa58a'.slice(2);

    } catch (err) {
      Lit.Actions.setResponse({ response: err.message });
      return;
    }

    // Decrypt the content of the nostr request
    const payload = await nip04Decrypt(nostrPrivateKey, nostrRequest.pubkey, nostrRequest.content);
    console.info('Received DM:', payload);

    const encryptedKeyFromStore = await Lit.Actions.runOnce(
      { waitForResponse: true, name: 'getEncryptedKeystore' },
      async () => {
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
        await supabaseClient.auth.signInWithPassword({
          email: SUPABASE_ADMIN_EMAIL,
          password: SUPABASE_ADMIN_PASSWORD,
        });

        console.info(JSON.stringify(supabase))
        console.info(nostrRequest.pubkey)
        // console.log(JSON.stringify(supabase), 'ddddddddddd', nostrRequest.pubkey)

        const { data: existedData, error } = await supabaseClient.from('keystore').select('*').eq('pubkey', nostrRequest.pubkey).single();
        console.info('JSON.stringify(existedData)')
        console.info(JSON.stringify(existedData))

        if (error) throw error

        return existedData
      })

    // // Fetch user keystore with supabase
    // const userKey = await supabase.from('user_key')
    //   .select('*')
    //   .eq('npub', nostrRequest.pubkey)
    
    // decrypt keystore 
    const keystore = typeof encryptedKeyFromStore.keystore === 'string' ? JSON.parse(encryptedKeyFromStore.keystore) : encryptedKeyFromStore.keystore
    const privateKeyfromKeystore = await Lit.Actions.decryptAndCombine({
      accessControlConditions,
      ciphertext: keystore.seedCiphertext,
      dataToEncryptHash: keystore.seedDataToEncryptHash,
      authSig: null,
      chain: 'ethereum',
    });

    console.log(privateKeyfromKeystore, 'privateKeyfromKeystore')

    const privateKey = privateKeyfromKeystore

    const wallet = new ethers.Wallet(privateKey);

    // get signature
    const jsonSignature = JSON.parse(signature);
    jsonSignature.r = "0x" + jsonSignature.r.substring(2);
    jsonSignature.s = "0x" + jsonSignature.s;
    // const hexSignature = ethers.utils.joinSignature(jsonSignature);

    let nonce;
    try {
      nonce = await Lit.Actions.getLatestNonce({
        address: wallet.address,
        chain: unsignedTransaction.chain,
      });
    } catch (err) {
      const errorMessage = 'Error: Unable to get the nonce- ' + err.message;
      Lit.Actions.setResponse({ response: errorMessage });
      return;
    }

    const tx = {
      to: unsignedTransaction.to,
      from: wallet.address,
      value: ethers.utils.hexlify(
        ethers.utils.parseEther(unsignedTransaction.value)
      ),
      chainId: unsignedTransaction.chainId,
      data: unsignedTransaction.dataHex,
      nonce,
    };

    let provider;
    try {
      const rpcUrl = await Lit.Actions.getRpcUrl({
        chain: unsignedTransaction.chain,
      });
      provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    } catch (err) {
      const errorMessage =
        `Error: Getting the rpc for the chain: ${unsignedTransaction.chain}- ` +
        err.message;
      Lit.Actions.setResponse({ response: errorMessage });
      return;
    }

    if (unsignedTransaction.gasPrice) {
      tx.gasPrice = ethers.utils.parseUnits(unsignedTransaction.gasPrice, 'gwei');
    } else {
      try {
        tx.gasPrice = await provider.getGasPrice();
      } catch (err) {
        const errorMessage = 'Error: When getting gas price- ' + err.message;
        Lit.Actions.setResponse({ response: errorMessage });
        return;
      }
    }

    if (unsignedTransaction.gasLimit) {
      tx.gasLimit = unsignedTransaction.gasLimit;
    } else {
      try {
        tx.gasLimit = await provider.estimateGas(tx);
      } catch (err) {
        const errorMessage = 'Error: When estimating gas- ' + err.message;
        Lit.Actions.setResponse({ response: errorMessage });
        return;
      }
    }

    try {
      const signedTx = await wallet.signTransaction(tx);

      if (broadcast) {
        const transactionResponse = await provider.sendTransaction(signedTx);
        Lit.Actions.setResponse({ response: transactionResponse.hash });
      } else {
        Lit.Actions.setResponse({ response: signedTx });
      }
    } catch (err) {
      const errorMessage = 'Error: When signing transaction- ' + err.message;
      Lit.Actions.setResponse({ response: errorMessage });
    }
  } catch (error) {
    Lit.Actions.setResponse({ response: error.message });
  } finally {

  }
})();
