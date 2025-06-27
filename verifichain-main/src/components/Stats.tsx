import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCheck, Files, Timer } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useBlockchain } from "@/contexts/blockchainContext";
import moment from "moment";
import { useToast } from "@/hooks/use-toast";
import { ethers } from "ethers";
const Stats = () => {
  const { contract, account } = useBlockchain();
  const { toast } = useToast();
  const [thisMontVerified,setThisMonthVerified] = useState(0);
  const [activeDocuments,setActiveDocuemnts] = useState(0)
  useEffect(() => {
    if (contract && account) {
      getThisMonthVerified();
      getActiveDocuments();
    }
  }, [account]);
  const getThisMonthVerified = async () => {
    try {
      const startOfMonth = moment().startOf('month').unix();
      const result = await contract.getActiveDocumentsSince(startOfMonth);
      setThisMonthVerified(ethers.toNumber(result));
    } catch (error) {
      toast({
        title: "Error",
        description: "Unknown Error!",
        variant: "destructive",
      });
    }
  };
  const getActiveDocuments = async () => {
    try {
      const result = await contract.getActiveDocumentCount();
      setActiveDocuemnts(ethers.toNumber(result));
    } catch (error) {
      toast({
        title: "Error",
        description: "Unknown Error!",
        variant: "destructive",
      });
    }
  };
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0 * 0.1 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Documents Verified
            </CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisMontVerified}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 * 0.1 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Documents
            </CardTitle>
            <Files className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDocuments}</div>
            <p className="text-xs text-muted-foreground">In verification</p>
          </CardContent>
        </Card>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 * 0.1 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Time</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4m</div>
            <p className="text-xs text-muted-foreground">Per verification</p>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
};

export default Stats;
