import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import DocumentUpload from "@/components/DocumentUpload";
import TransactionHistory, { Transaction } from "@/components/TransactionHistory";
import VerificationStatus, { VerificationStatusProps } from "@/components/VerificationStatus";
import Stats from "@/components/Stats";
import DecryptedText from "@/components/DecryptedText";
import Profile from "@/components/Profile";
import { useToast } from "@/hooks/use-toast";
import Dock from "@/components/Dock";
import { File } from "lucide-react";
import LiquidChrome from "@/components/LiquidChrome";
import { useBlockchain } from "@/contexts/blockchainContext";
import { ethers } from "ethers";

const Index = () => {
  const { contract, account } = useBlockchain();
  const [activeDocument, setActiveDocument] = useState<VerificationStatusProps>();
  const [showDashboard, setShowDashboard] = useState(false);
  const [activePage, setActivePage] = useState<"home" | "documents" | "profile">("home");
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (account && contract) {
      getTransactionHistory();
    }
  }, [account]);

  const isLoggedIn = () => {
    const storedWalletAddress = localStorage.getItem("walletAddress");
    const storedIsSignedUp = localStorage.getItem("isSignedUp");
    return !!storedWalletAddress && storedIsSignedUp === "true";
  };

  const getTransactionHistory = async () => {
    try {
      if (!account) return;
      const requestCount = await contract.getRequestCount();
      const count = ethers.toNumber(requestCount);
      if (count !== 0) {
        const recentDocument = await contract.requests(count - 1);
        setActiveDocument({
          documentName: recentDocument[4],
          status: recentDocument[2],
        });
      }
      const allTransactions: Transaction[] = [];
      for (let i = 0; i < count; i++) {
        const getRequestCount = await contract.requests(i);
        const newTransaction = {
          hash: getRequestCount[0],
          address: getRequestCount[1],
          status: getRequestCount[2],
          verifier: getRequestCount[3],
          documentName: getRequestCount[4],
          timeStamp: getRequestCount[5],
        };
        allTransactions.unshift(newTransaction);
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

  const handleDocumentUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("documentVerify", file);
      const response = await fetch("http://localhost:3001/UploadDocumentVerify/", {
        method: "POST",
        headers: {},
        body: formData,
      });
      const data = await response.json().catch((err) => console.log(err));
      if (!data || !data.hash) return;

      setActiveDocument({
        documentName: file.name,
        status: 0,
      });

      toast({
        title: "Document Uploaded",
        description: "Your document is being processed for verification.",
        variant: "default",
      });

      const result = await contract.requestVerification(data.hash, file.name);
      await result.wait();

      const isAuto = await contract.isAutoVerified(
        await contract.getRequestCount().then((res) => ethers.toNumber(res) - 1)
      );

      toast({
        title: "Document Uploaded",
        description: isAuto
          ? "✅ Your document was auto-verified successfully!"
          : "⏳ Upload successful. Awaiting manual verification.",
        variant: "default",
      });

      getTransactionHistory();
    } catch (error) {
      toast({
        title: "Document Uploaded",
        description: "Your document contained an error.",
        variant: "destructive",
      });
    }
  };

  const handleNavigate = (page: "home" | "documents" | "profile") => {
    if (page === "home") setShowDashboard(false);
    else setShowDashboard(true);
    setActivePage(page);
  };

  if (!showDashboard) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center px-4">
        <div className="absolute inset-0">
          <LiquidChrome
            speed={0.5}
            amplitude={0.3}
            baseColor={[0.1, 0.1, 0.1]}
          />
        </div>
        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-5xl font-bold mb-6 text-lime-400">
              <DecryptedText
                text="DocuChain "
                className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-lime-400"
              />
            </h1>
            <div className="mb-8 text-lg text-gray-100 space-y-4">
              <DecryptedText text="Secure your documents with blockchain technology." className="block" />
              <DecryptedText text="Immutable. Verifiable. Trustworthy." className="block" />
            </div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
              <Button size="lg" className="rounded-full px-8" onClick={() => handleNavigate("profile")}>
                Get Started
              </Button>
            </motion.div>
          </motion.div>
        </div>
        <Dock activePage={activePage} onNavigate={handleNavigate} className="z-20 relative" />
      </div>
    );
  }

  return (
    activePage === "profile" ? (
      <div className="relative min-h-screen bg-black overflow-hidden">
        <div className="absolute inset-0 z-0">
          <LiquidChrome
            speed={0.5}
            amplitude={0.3}
            baseColor={[0.1, 0.1, 0.1]}
            className="w-full h-full"
          />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-16">
          <h1 className="text-4xl font-semibold text-center mb-2 text-lime-400">DocuChain</h1>
          <p className="text-white/80 text-center mb-8">Secure Document Verification System</p>
          <Profile />
        </div>
        <Dock activePage={activePage} onNavigate={handleNavigate} className="relative z-10 mt-8" />
      </div>
    ) : (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <main className="container mx-auto px-4 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl font-semibold text-center mb-2">DocuChain</h1>
            <p className="text-muted-foreground text-center mb-8">
              Secure Document Verification System
            </p>

            {isLoggedIn() && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Stats />
              </div>
            )}

            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="w-full justify-start mb-6">
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="verify">Verify</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="upload">
                <Card className="mb-20">
                  <CardContent className="p-6">
                    {isLoggedIn() ? (
                      <DocumentUpload onUploadComplete={getTransactionHistory} />
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <File className="w-12 h-12 mx-auto mb-4" />
                        <p className="mb-4">Please log in to upload documents for verification.</p>
                        <Button onClick={() => handleNavigate("profile")}>Go to Profile</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="verify">
                <Card className="mb-20">
                  <CardContent className="p-6">
                    {activeDocument && <VerificationStatus {...activeDocument} />}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history">
                <Card className="mb-20">
                  <CardContent className="p-6">
                    <ScrollArea className="h-[400px]">
                      <TransactionHistory transactions={transactions} />
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </main>
        <Dock activePage={activePage} onNavigate={handleNavigate} />
      </div>
    )
  );
};

export default Index;
