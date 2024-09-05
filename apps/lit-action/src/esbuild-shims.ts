globalThis.require = (name) => {
  // https://developer.litprotocol.com/sdk/serverless-signing/dependencies
  if (name === "ethers") {
    // deno-lint-ignore ban-ts-comment
    // @ts-expect-error
    return ethers;
  }
  if (name === "jsonwebtoken") {
    // deno-lint-ignore ban-ts-comment
    // @ts-expect-error
    return jwt;
  }
  throw new Error("unknown module " + name);
};
