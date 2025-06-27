import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import Web3 from 'web3';
import DocumentVerification from "@/abi/documentVerification.json"; // ✅ your ABI import like verifier.tsx

const DocumentUpload = ({ onUploadComplete }: { onUploadComplete?: (cid: string, name: string) => void }) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const getUserAddress = async () => {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      return accounts[0];
    } else {
      throw new Error("MetaMask is not installed");
    }
  };

  const uploadToBackend = async (file: File, userAddress: string) => {
    const formData = new FormData();
    formData.append("documentVerify", file);
    formData.append("userAddress", userAddress);
    formData.append("documentName", file.name);

    const response = await fetch("http://localhost:3001/UploadDocumentVerify/", {
      method: "POST",
      body: formData
    });

    if (!response.ok) throw new Error("Upload failed");
    return await response.json(); // { hash, name }
  };

  const uploadAndRegisterDocument = async (cid: string, documentName: string, userAddress: string) => {
    const web3 = new Web3(window.ethereum);

    // Get correct network ID
    const networkId = await web3.eth.net.getId();
    const deployedNetwork = (DocumentVerification.networks as any)[networkId.toString()];


    if (!deployedNetwork) {
      throw new Error("Smart contract not deployed on detected network");
    }

    const contract = new web3.eth.Contract(
      DocumentVerification.abi as any,
      deployedNetwork.address
    );

    // ✅ Call storeDocumentCID
    await contract.methods.storeDocumentCID(cid).send({ from: userAddress });

    // ✅ Then call requestVerification
    await contract.methods.requestVerification(cid, documentName).send({ from: userAddress });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];

      try {
        setUploading(true);

        const userAddress = await getUserAddress();
        const { hash, name } = await uploadToBackend(file, userAddress);

        await uploadAndRegisterDocument(hash, name, userAddress);
        // ✅ Check if auto-verified
const web3 = new Web3(window.ethereum);
const networkId = await web3.eth.net.getId();
const deployedNetwork = (DocumentVerification.networks as any)[networkId.toString()];
const contract = new web3.eth.Contract(
  DocumentVerification.abi as any,
  deployedNetwork.address
);

const requestCount = await contract.methods.getRequestCount().call();
const isAuto = await contract.methods
  .isAutoVerified(Number(requestCount) - 1)
  .call();

toast({
  title: "Upload Successful",
  description: isAuto
    ? `✅ Auto-Verified (CID: ${hash})`
    : `⏳ Awaiting manual verification (CID: ${hash})`,
  variant: "default",
});

        //toast({ title: "Upload Successful", description: `CID: ${hash}` });
        onUploadComplete?.(hash, name);

      } catch (error: any) {
        console.error(error);
        toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
      } finally {
        setUploading(false);
      }
    }
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    multiple: false,
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Card
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
            transition-colors duration-200
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'}
          `}
        >
          <input {...getInputProps()} disabled={uploading} />
          <Upload className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
          <h3 className="text-lg font-medium mb-2">
            {uploading ? "Uploading..." : isDragActive ? "Drop your document here" : "Drag and drop your document"}
          </h3>
          <p className="text-sm text-muted-foreground">PDF, PNG, JPEG supported</p>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default DocumentUpload;
