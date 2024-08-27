import nacl from "tweetnacl";
import naclUtil from "tweetnacl-util";
import bs58 from "bs58";
import crypto from "crypto";

export const verifyTrxn = (trxn) => {
  const { sender, receiver, amount, signature } = trxn;

  // Recreate the transaction data hash
  const trxnData = JSON.stringify({
    sender: sender,
    receiver: receiver,
    amount: amount,
  });

  const trxnDataUint8 = naclUtil.decodeUTF8(trxnData);

  const signature58 = bs58.decode(trxn.signature);
  const publicKey = bs58.decode(sender);
  console.log(publicKey.length);

  // Verify the signature
  const isValid = nacl.sign.detached.verify(
    trxnDataUint8,
    signature58,
    publicKey
  );
  console.log(isValid);

  return isValid;
};

export const createBlock = (transactions, latestId, blockChain) => {
  const block = {
    index: latestId,
    previousHash: blockChain[blockChain.length - 1]?.hash ?? "0".repeat(64),
    timestamp: Math.floor(Date.now() / 1000),
    transactions: [...transactions],
  };
  return block;
};

export const mineBlock = (block) => {
  block = JSON.stringify(block);
  let hash = "";
  let i = 0;

  while (hash.slice(0, 5) !== "00000") {
    hash = crypto
      .createHash("sha256")
      .update(block + i)
      .digest("hex");
    i++;
  }

  // Add nonce and final hash to the block
  const minedBlock = JSON.parse(block);
  minedBlock.nonce = i - 1;
  minedBlock.hash = hash;

  return minedBlock;
};
