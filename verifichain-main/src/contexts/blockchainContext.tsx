import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { ethers } from "ethers";
import DocumentVerification from "../../smart contract/DocumentVerification.json";

// Define types
interface BlockchainContextProps {
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  account: string | null;
  contract: ethers.Contract | null;
  connectWallet: () => Promise<void>;
}

const BlockchainContext = createContext<BlockchainContextProps | undefined>(
  undefined
);

// Replace with your actual contract address
const contractAddress = DocumentVerification.networks["5777"].address;

export const BlockchainProvider = ({ children }: { children: ReactNode }) => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const _provider = new ethers.BrowserProvider(window.ethereum);
        await _provider.send("eth_requestAccounts", []);
        const _signer = await _provider.getSigner();
        const _account = await _signer.getAddress();
        const _contract = new ethers.Contract(
          contractAddress,
          DocumentVerification.abi,
          _signer
        );

        setProvider(_provider);
        setSigner(_signer);
        setAccount(_account);
        setContract(_contract);
      } catch (err) {
        console.error("Wallet connection error:", err);
      }
    } else {
      alert("MetaMask is not installed.");
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", connectWallet);
    }
  }, []);

  return (
    <BlockchainContext.Provider
      value={{ provider, signer, account, contract, connectWallet }}
    >
      {children}
    </BlockchainContext.Provider>
  );
};

export const useBlockchain = (): BlockchainContextProps => {
  const context = useContext(BlockchainContext);
  if (!context) {
    throw new Error("useBlockchain must be used within a BlockchainProvider");
  }
  return context;
};
