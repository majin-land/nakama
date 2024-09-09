import { verifyEvent } from 'https://esm.sh/nostr-tools@2.7.2/pure'
import { removeSaltFromDecryptedKey } from '../utils.js'

/** *
 * Signs a transaction with the Ethers wallet whose private key is decrypted inside the Lit Action.
 *
 * @jsParam seedCiphertext - For the encrypted Wrapped Key
 * @jsParam seedDataToEncryptHash - For the encrypted Wrapped Key
 * @jsParam ciphertext - For the encrypted Wrapped Key
 * @jsParam dataToEncryptHash - For the encrypted Wrapped Key
 * @jsParam nostrEvent - nostrEvent
 * @jsParam accessControlConditions - The access control condition that allows only the pkpAddress to decrypt the Wrapped Key
 *
 * @returns { Promise<string> } - Returns the transaction hash if broadcast is set as true else returns only the signed transaction. Or returns errors if any.
 */
;(async () => {
  // Validate nostr request
  const isValid = verifyEvent(nostrEvent) // @JsParams nostrEvent
  if (!isValid) throw new Error('Invalid nostr request')

  const instruction = await Lit.Actions.call({
    ipfsId: 'Qmb9NqJiXV9dxMgciQMLJWaju3hqAP4juQ2JUt5hChEg1e',
    params: {
      accessControlConditions,
      ciphertext,
      dataToEncryptHash,
      nostrEvent,
    },
  })

  const walletDecryptedSeed = await Lit.Actions.decryptAndCombine({
    accessControlConditions, // @JSParams accessControlConditions
    ciphertext: seedCiphertext, // @JSParams seedCiphertext
    dataToEncryptHash: seedDataToEncryptHash, // @JSParams seedDataToEncryptHash
    chain: 'ethereum',
    authSig: null,
  })

  let seed
  try {
    seed = removeSaltFromDecryptedKey(walletDecryptedSeed)
  } catch (err) {
    Lit.Actions.setResponse({ response: err.message })
    return
  }

  let rootHDNode
  try {
    const textEncoder = new TextEncoder()
    const seedUint8Array = new Uint8Array(64)
    textEncoder.encodeInto(seed, seedUint8Array)
    rootHDNode = ethers.utils.HDNode.fromSeed(seedUint8Array)
  } catch (err) {
    Lit.Actions.setResponse({ response: 'ERR HDNode.fromSeed ' + err.message })
    return
  }

  let hd
  try {
    const path = "m/44'/60'/0'/0/0"
    hd = rootHDNode.derivePath(path)
  } catch (err) {
    Lit.Actions.setResponse({ response: 'ERR rootHDNode.derivePath ' + err.message })
    return
  }

  let wallet
  try {
    wallet = new ethers.Wallet(hd)
  } catch (err) {
    Lit.Actions.setResponse({ response: 'ERR ethers.Wallet ' + err.message })
    return
  }

  // Example Instructions:
  // send 10 of token 0x003243243214 via ethereum chain to 0x4324132353
  // send 10 of gas via ethereum chain to 0x4324132353
  // send 10 of token 0x003243243214 via solana chain to 0x4324132353
  // send 10 of coin via solana chain to 0x4324132353
  const regex = /^send (\d*\.?\d*) of (\w+) via (\w+) chain to (0x[a-fA-F0-9]+)$/

  const match = instruction.match(regex) // @JSParams instruction
  if (!match) {
    const errorMessage = `Error: Matching instruction`
    Lit.Actions.setResponse({ response: errorMessage })
    return
  }

  const command = {
    amount: match[1],
    token: match[2] || null, // Optional, could be null if not present
    chain: match[3],
    recipient: match[4],
  }

  let nonce
  try {
    nonce = await Lit.Actions.getLatestNonce({
      address: wallet.address,
      chain: command.chain,
    })
  } catch (err) {
    const errorMessage = 'Error: Unable to get the nonce- ' + err.message
    Lit.Actions.setResponse({ response: errorMessage })
    return
  }

  let provider
  try {
    const rpcUrl = await Lit.Actions.getRpcUrl({
      chain: command.chain,
    })
    provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  } catch (err) {
    const errorMessage = `Error: Getting the rpc for the chain: ${chain}- ` + err.message
    Lit.Actions.setResponse({ response: errorMessage })
    return
  }

  const tx = {
    to: command.recipient,
    from: wallet.address,
    value: ethers.utils.hexlify(ethers.utils.parseEther(command.amount)), // @JSParams value
    nonce,
  }

  try {
    tx.gasPrice = await provider.getGasPrice()
  } catch (err) {
    const errorMessage = 'Error: When getting gas price- ' + err.message
    Lit.Actions.setResponse({ response: errorMessage })
    return
  }

  try {
    tx.gasLimit = await provider.estimateGas(tx)
  } catch (err) {
    const errorMessage = 'Error: When estimating gas- ' + err.message
    Lit.Actions.setResponse({ response: errorMessage })
    return
  }

  try {
    const signedTx = await wallet.signTransaction(tx)
    const transactionResponse = await provider.sendTransaction(signedTx)
    Lit.Actions.setResponse({ response: transactionResponse.hash })
  } catch (err) {
    const errorMessage = 'Error: When signing transaction- ' + err.message
    Lit.Actions.setResponse({ response: errorMessage })
  }
})()
