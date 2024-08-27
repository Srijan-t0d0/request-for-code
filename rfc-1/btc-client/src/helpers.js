import nacl from "tweetnacl";
import naclUtil from "tweetnacl-util";
import bs58 from "bs58";

export function createTrnx(to, amt) {
  // Retrieve and decode keys from Base58
  const publicKey = bs58.decode(localStorage.getItem("publicKey"));
  const privateKey = bs58.decode(localStorage.getItem("privateKey"));

  // Prepare transaction object
  let trnx = {
    sender: bs58.encode(publicKey),
    receiver: to,
    amount: amt,
    signature: "",
  };

  // Create transaction data string (excluding signature)
  const trnxData = JSON.stringify({
    sender: trnx.sender,
    receiver: trnx.receiver,
    amount: trnx.amount,
  });

  // Convert transaction data to Uint8Array
  const trnxDataUint8 = naclUtil.decodeUTF8(trnxData);

  // Sign the transaction

  const signature = nacl.sign.detached(trnxDataUint8, privateKey);

  // Add the signature to the transaction
  trnx.signature = bs58.encode(signature);

  return trnx;
}
