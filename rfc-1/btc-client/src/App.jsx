import { useState } from 'react'
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
import bs58 from 'bs58'
import './App.css'
import { useEffect } from 'react'
import { createTrnx } from './helpers';

function App() {
  const [keyPair, setKeyPair] = useState(null);
  const [formData,setFormData] = useState({});
  const [ws,setWs] = useState(null)

  useEffect(() => {
    const publicKey = localStorage.getItem("publicKey");
    const privateKey = localStorage.getItem("privateKey");
    if (publicKey && privateKey) {
      setKeyPair({ publicKey, privateKey });
    }
    try {

      const socket = new WebSocket('ws://localhost:8081');
      setWs(socket);
      socket.onmessage = (event) => {
        console.log('Received from server:', event.data);
      };
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      return () => socket.close();

    } catch (error) {
      console.error('WebSocket connection failed:', error);
    }
  }, []);

  function createKeyPair() {
    if (!keyPair) {
      const newKeyPair = nacl.sign.keyPair();
      const publicKey =bs58.encode(newKeyPair.publicKey);
      const secretKey =bs58.encode(newKeyPair.secretKey);

      console.log('Public Key:', publicKey);
      console.log('Secret Key:', secretKey);

      // Save to localStorage
      localStorage.setItem("publicKey", publicKey);
      localStorage.setItem("privateKey", secretKey);
      localStorage.setItem("publicKeyRaw", newKeyPair.publicKey);
      localStorage.setItem("privateKeyRaw", newKeyPair.secretKey);

      // Update state to trigger re-render
      setKeyPair({ publicKey, privateKey: secretKey });
    }
  }
  function changeFormData(e) {
    console.log(e.target.value);
    setFormData((prevFormData) => ({
      ...prevFormData,
      [e.target.id]: e.target.value,
    }));
  }
  
  

  function sendMoney(){
    if(formData?.to && formData?.amount){
    let trxn = createTrnx(formData.to,formData.amount)

    ws.send(JSON.stringify({
      type:'trxn',
      trxn
    }))
    
  }
   
    
  }

 
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      {!keyPair && (
        <button
          onClick={createKeyPair}
          className="bg-blue-600 text-white p-3 rounded-lg shadow-lg hover:bg-blue-700 transition duration-300"
        >
          Generate Account
        </button>
      )}
      {keyPair && (
        <div className="w-full max-w-lg bg-white shadow-md rounded-lg p-6 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Your Wallet Address</h2>
            <p className="text-gray-700 break-all">{keyPair.publicKey}</p>
          </div>
          <div>
            <h1 className="text-xl font-bold mb-4">Send Money</h1>
            <div className="space-y-4">
              <div>
                <label htmlFor="wallet-address" className="block text-sm font-medium text-gray-700 mb-1">
                  Wallet Address
                </label>
                <input
                onChange={changeFormData}
                  id="to"
                  type="text"
                  placeholder="Enter wallet address"
                  className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                 onChange={changeFormData}
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
               <button
               onClick={sendMoney}
        className="bg-blue-600 text-white p-4 rounded-lg shadow-lg hover:bg-blue-700 transition duration-300"
      >
        Send
      </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;