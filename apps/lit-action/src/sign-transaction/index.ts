const { removeSaltFromDecryptedKey } = require('../../utils');

import { finalizeEvent, verifyEvent } from "https://esm.sh/nostr-tools@2.7.2/pure";
import { decrypt as nip04Decrypt, encrypt as nip04Encrypt } from "https://esm.sh/nostr-tools@2.7.2/nip04.js";

/**
 *
 * Signs a transaction with the Ethers wallet whose private key is decrypted inside the Lit Action.
 *
 * @jsParam pkpAddress - The Eth address of the PKP which is associated with the Wrapped Key
 * @jsParam ciphertext - For the encrypted Wrapped Key of Nostr
 * @jsParam dataToEncryptHash - For the encrypted Wrapped Key of Nostr
 * @jsParam seedCiphertext - For the encrypted Wrapped Key
 * @jsParam seedDataToEncryptHash - For the encrypted Wrapped Key
 * @jsParam unsignedTransaction - The unsigned message to be signed by the Wrapped Key
 * @jsParam broadcast - Flag used to determine whether to just sign the message or also to broadcast it using the node's RPC. Note, if the RPC doesn't exist for the chain then the Lit Action will throw an unsupported error.
 * @jsParam accessControlConditions - The access control condition that allows only the pkpAddress to decrypt the Wrapped Key
 *
 * @returns { Promise<string> } - Returns the transaction hash if broadcast is set as true else returns only the signed transaction. Or returns errors if any.
 */
(async () => {
  const nostrTransaction = unsignedTransaction;
  const isValid = verifyEvent(nostrTransaction); // @JsParams unsignedTransaction

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

  let privateKey;
  try {
    privateKey = removeSaltFromDecryptedKey(decryptedPrivateKey);
  } catch (err) {
    Lit.Actions.setResponse({ response: err.message });
    return;
  }
  
  // Decrypt the content of the nostr request
  const nostrPrivateKey = ethers.utils.arrayify(privateKey.slice(4))
  const instruction = await nip04Decrypt(nostrPrivateKey, nostrRequest.pubkey, nostrRequest.content);
  console.info('Received DM:', instruction);
 
  // Example Instructions:
  // send 10 of token 0x003243243214 via ethereum chain 0x314 from account 0 to 0x4324132353 
  // send 10 of gas via ethereum chain 0x314 to 0x4324132353
  // send 10 of token 0x003243243214 via solana chain mainnet from account 1 to 0x4324132353
  // send 10 of coin via solana chain mainnet to 0x4324132353

  const regex = /^send (\d+) of (\w+)(?: (0x[a-fA-F0-9]+))? via (\w+) chain (\w+|0x[a-fA-F0-9]+) to (0x[a-fA-F0-9]+)$/;

  const match = instruction.match(regex);
  
  if (match) {
    const command = {
      amount: parseInt(match[1], 10),
      type: match[2],
      token: match[3] || null, // Optional, could be null if not present
      chain: match[4],
      chainId: match[5],
      recipient: match[6]
    };
    
    if (command.chain === 'ethereum') {
      if (['gas', 'coin'].includes(type)) {
        unsignedTransaction = {
          chainId: command.chainId,
          chain: "yellowstone",
          toAddress: command.recipient,
          value: command.amount,
          // Manually specifying because the generated private key doesn't hold a balance and ethers
          // fails to estimate gas since the tx simulation fails with insufficient balance error
          gasLimit: 21_000,
        };
      } else {
        throw new Error('Invalid currency type')
      }

      if (!unsignedTransaction.toAddress) {
        Lit.Actions.setResponse({
          response: 'Error: Missing required field: toAddress',
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

      let walletDecryptedPrivateKey;
      try {
        walletDecryptedPrivateKey = await Lit.Actions.decryptAndCombine({
          accessControlConditions,
          ciphertext: seedCiphertext, // @JSParams seedCiphertext
          dataToEncryptHash: seedDataToEncryptHash, // @JSParams seedDataToEncryptHash
          chain: 'ethereum',
          authSig: null,
        });
      }

      const path = "m/44'/60'/0'/0"
      const wallet = ethers.Wallet.fromSeed(walletDecryptedPrivateKey);

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
        to: unsignedTransaction.toAddress,
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
    } else if (command.chain.toLowerCase() === 'solana') {
      console.log("not implemented");
    }
    
    console.log(result);
  } else {
    console.log("Text does not match the pattern.");
  }
})();