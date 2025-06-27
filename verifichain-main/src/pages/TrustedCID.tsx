import React, { useEffect, useState } from "react";
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

const TrustedCID = () => {
  const { toast } = useToast();
  const { account } = useBlockchain();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cidList, setCidList] = useState([]);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const fetchCIDList = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/trusted-cids");
      const data = await response.json();
      setCidList(data);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to load trusted CIDs", variant: "destructive" });
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("documentVerify", file);

      const response = await fetch("http://localhost:3001/UploadDocumentVerify/", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      const cid = data.hash;

      const web3 = new Web3(window.ethereum);
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = (DocumentVerification.networks as any)[networkId.toString()];
      const contract = new web3.eth.Contract(
        DocumentVerification.abi as any,
        deployedNetwork.address
      );

      await contract.methods.addTrustedCID(cid).send({ from: account });

      toast({ title: "Trusted CID Registered", description: `CID: ${cid}` });
      fetchCIDList(); // refresh table
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const removeCID = async (cid: string) => {
    try {
      const web3 = new Web3(window.ethereum);
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = (DocumentVerification.networks as any)[networkId.toString()];
      const contract = new web3.eth.Contract(
        DocumentVerification.abi as any,
        deployedNetwork.address
      );

      await contract.methods.removeTrustedCID(cid).send({ from: account });
      toast({ title: "CID Removed", description: cid });
      fetchCIDList();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Removal failed", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchCIDList();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ChevronLeft className="cursor-pointer mb-3" onClick={() => navigate(-1)} />
          <h1 className="text-4xl font-semibold text-center mb-2">DocuChain</h1>
          <p className="text-muted-foreground text-center mb-8">
            Manage Trusted Document Hashes
          </p>

          <Card className="mb-8 max-w-xl mx-auto">
            <CardHeader>
              <CardTitle>Add Trusted Document</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input type="file" onChange={handleFileChange} />
              <Button onClick={handleSubmit} disabled={uploading || !file}>
                {uploading ? "Processing..." : "Upload & Register"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trusted CID List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2">CID</th>
                      <th className="px-4 py-2">Name</th>
                      <th className="px-4 py-2">Timestamp</th>
                      <th className="px-4 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cidList.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="px-4 py-2 font-mono truncate max-w-[200px]">{item.cid}</td>
                        <td className="px-4 py-2">{item.name}</td>
                        <td className="px-4 py-2">{new Date(item.timestamp * 1000).toLocaleString()}</td>
                        <td className="px-4 py-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeCID(item.cid)}
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {cidList.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-4 text-muted-foreground text-center">
                          No trusted CIDs found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default TrustedCID;
