import { motion } from "framer-motion";
import { Check, Clock, File, XCircle, DownloadCloud, ChevronLeft } from "lucide-react";
import { ethers } from "ethers";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useBlockchain } from "@/contexts/blockchainContext";
import { Button } from "@/components/ui/button";
import download from "downloadjs";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { contract, account } = useBlockchain();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (account && contract) {
      getTransactionHistory();
    }
  }, [account]);

  const getTransactionHistory = async () => {
    try {
      if (!account) return;
      const requestCount = await contract.getRequestCount();
      const count = ethers.toNumber(requestCount);
      const allTransactions = [];

      for (let i = 0; i < count; i++) {
        const getRequestCount = await contract.requests(i);
        const isAuto = await contract.isAutoVerified(i); // ✅ Get auto-verified flag
        const newTransaction = {
          id: i,
          hash: getRequestCount[0],
          address: getRequestCount[1],
          status: ethers.toNumber(getRequestCount[2]),
          verifier: getRequestCount[3],
          documentName: getRequestCount[4],
          timeStamp: getRequestCount[5],
          autoVerified: isAuto,
        };
        allTransactions.push(newTransaction);
      }

      setTransactions(allTransactions);
    } catch (error) {
      toast({
        title: "Error",
        description: "Unknown Error!",
        variant: "destructive",
      });
    }
  };

  const getFileNameForHash = async (hash) => {
    const response = await fetch("http://localhost:3001/GetFileName/" + hash);
    const data = await response.json().catch((err) => console.log(err));
    return data?.name || "Unknown";
  };

  const downloadFile = async (hash) => {
    try {
      const url = `https://gateway.pinata.cloud/ipfs/${hash}`;
      const response = await fetch(url);
      const blob = await response.blob();

      const mime = blob.type;
      const extensionMap = {
        "application/pdf": "pdf",
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/webp": "webp"
      };
      const ext = extensionMap[mime] || "bin";

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `document-${hash}.${ext}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const acceptorReject = async (id, status) => {
    try {
      const result = await contract.verifyRequest(id, status);
      await result.wait();
      getTransactionHistory();
    } catch (error) {
      toast({
        title: "Error",
        description: "Unknown Error!",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-semibold text-center mb-2">DocuChain</h1>
          <p className="text-muted-foreground text-center mb-8">
            Secure Document Verification System
          </p>
          <ChevronLeft className="cursor-pointer mb-3" onClick={() => navigate(-1)} />
          {transactions.map((transaction, index) => (
            <Card key={index} className="mb-3">
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <File className="w-8 h-8 text-primary" />
                <div className="flex-1">
                  <h3 className="font-medium">{transaction.documentName}</h3>
                  <p className="text-sm text-muted-foreground">{transaction.address}</p>
                  <p className="text-sm text-muted-foreground">
                    {transaction.status === 0
                      ? "Pending"
                      : transaction.status === 1
                      ? "Approved"
                      : "Rejected"}
                  </p>
                  {transaction.autoVerified && (
                    <p className="text-xs text-green-500 font-semibold">✅ Auto-Verified</p>
                  )}
                </div>

                {transaction.status === 0 && (
                  <Clock className="w-6 h-6 text-yellow-500" />
                )}
                {transaction.status === 1 && (
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                )}
                {transaction.status === 2 && (
                  <XCircle className="mr-2 h-4 w-4 text-red-500" />
                )}

                <DownloadCloud
                  className="mr-2 cursor-pointer"
                  onClick={() => downloadFile(transaction.hash)}
                />

                {transaction.status === 0 && (
                  <>
                    <Button
                      variant="default"
                      size="sm"
                      className="gap-2"
                      onClick={() => acceptorReject(transaction.id, true)}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-2"
                      onClick={() => acceptorReject(transaction.id, false)}
                    >
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </motion.div>
      </main>
    </div>
  );
};

export default Index;
