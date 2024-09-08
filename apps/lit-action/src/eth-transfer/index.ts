const { send } = require('./send.ts')
const { register } = require('./register.ts')

/**
 *
 * Signs a transaction with the Ethers wallet whose private key is decrypted inside the Lit Action.
 *
 * @jsParam publicKey - PKP public key
 * @jsParam seedCiphertext - For the encrypted Wrapped Key
 * @jsParam seedDataToEncryptHash - For the encrypted Wrapped Key
 * @jsParam ciphertext - For the encrypted Wrapped Key
 * @jsParam dataToEncryptHash - For the encrypted Wrapped Key
 * @jsParam nostrEvent - The unsigned message to be signed by the Wrapped Key
 * @jsParam chain - chain name to be used ethereum/sepolia
 * @jsParam toAddress - eth address to send to
 * @jsParam value - value of eth to be transferred
 * @jsParam accessControlConditions - The access control condition that allows only the pkpAddress to decrypt the Wrapped Key
 *
 * @returns { Promise<string> } - Returns the transaction hash if broadcast is set as true else returns only the signed transaction. Or returns errors if any.
 */
;(async () => {
  const payload = await Lit.Actions.call({
    ipfsId: 'Qmb9NqJiXV9dxMgciQMLJWaju3hqAP4juQ2JUt5hChEg1e',
    params: {
      accessControlConditions,
      ciphertext,
      dataToEncryptHash,
      nostrEvent,
    },
  })
  if (payload == 'register') {
    await register({
      pubkey: nostrEvent.pubkey,
      accessControlConditions: accessControlConditions,
      supabaseUrl: supabase.url,
      supabaseServiceRole: supabase.serviceRole,
      supabaseEmail: supabase.email,
      supabasePassword: supabase.password,
    })
    return
  } else {
    const walletDecryptedSeed = await Lit.Actions.decryptAndCombine({
      accessControlConditions, // @JSParams accessControlConditions
      ciphertext: seedCiphertext, // @JSParams seedCiphertext
      dataToEncryptHash: seedDataToEncryptHash, // @JSParams seedDataToEncryptHash
      chain: 'ethereum',
      authSig: null,
    })

    switch (payload) {
      case 'send':
        await send({ walletDecryptedSeed, chain, toAddress, value })
        break
      default:
        // do nothing
        Lit.Actions.setResponse({ response: 'invalid command ' + payload })
        return
    }
    return
  }
})()
