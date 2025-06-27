import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useBlockchain } from "@/contexts/blockchainContext";
import Web3 from "web3";
import DocumentVerification from "@/abi/documentVerification.json";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AddVerifier = () => {
  const { contract, account } = useBlockchain();
  const { toast } = useToast();
  const [verifierAddress, setVerifierAddress] = useState("");
  const [transactions, setTransactions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (account && contract) {
      getVerifierList();
    }
  }, [account]);

  const getVerifierList = async () => {
    try {
      const result = await contract.getAllVerifiers();
      setTransactions(result);
    } catch (error) {
      toast({ title: "Error", description: "Unable to fetch verifier list", variant: "destructive" });
    }
  };

  const handleAddVerifier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tx = await contract.addVerifier(verifierAddress);
      await tx.wait();
      setVerifierAddress("");
      getVerifierList();
      toast({ title: "Success", description: "Verifier added." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to add verifier", variant: "destructive" });
    }
  };

  const handleRemoveVerifier = async (address: string) => {
    try {
      const tx = await contract.removeVerifier(address);
      await tx.wait();
      getVerifierList();
      toast({ title: "Success", description: "Verifier removed." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove verifier", variant: "destructive" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4 py-8"
    >
      <div className="max-w-2xl mx-auto">
        <ChevronLeft className="cursor-pointer mb-3" onClick={() => navigate(-1)} />
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add Verifier</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAddVerifier} className="space-y-4">
              <div className="space-y-2">
                <label>Verifier Address</label>
                <Input
                  value={verifierAddress}
                  onChange={(e) => setVerifierAddress(e.target.value)}
                  placeholder="0x..."
                  required
                />
              </div>
              <Button type="submit">Add</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verifier List</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {transactions.map((address, index) => (
              <div key={index} className="flex justify-between items-center border-b py-2">
                <span className="text-sm font-mono">{address}</span>
                <Button size="sm" variant="destructive" onClick={() => handleRemoveVerifier(address)}>
                  Remove
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default AddVerifier;