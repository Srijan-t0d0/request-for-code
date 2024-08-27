import crypto from "crypto";

export const verifyBlock = (block) => {
  let blockTBV = {
    index: block.index,
    previousHash: block.previousHash,
    timestamp: block.timestamp,
    transactions: block.transactions,
  };
  blockTBV = JSON.stringify(blockTBV);

  let hash = crypto
    .createHash("sha256")
    .update(blockTBV + block.nonce)
    .digest("hex");

  if (hash.slice(0, 5) == "00000") {
    return true;
  }
  return false;
};
