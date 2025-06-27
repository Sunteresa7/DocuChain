import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock, File, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ethers } from "ethers";

export interface VerificationStatusProps {
  documentName: string | null;
  status: number | 0;
}

const VerificationStatus = (documentOB: VerificationStatusProps) => {
  if (!documentOB) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <File className="w-12 h-12 mx-auto mb-4" />
        <p>No document selected for verification</p>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    if (status === "success") {
      return (
        <Badge variant="outline">
          <Check className="mr-2 h-4 w-4 text-green-500" /> Success
        </Badge>
      );
    } else if (status === "pending") {
      return (
        <Badge variant="secondary">
          <Clock className="mr-2 h-4 w-4 animate-spin text-yellow-500" />{" "}
          Pending
        </Badge>
      );
    } else if (status === "failed") {
      return (
        <Badge variant="destructive">
          <XCircle className="mr-2 h-4 w-4 text-red-500" /> Failed
        </Badge>
      );
    }
    return null;
  };
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <File className="w-8 h-8 text-primary" />
          <div className="flex-1">
            <h3 className="font-medium">{documentOB.documentName}</h3>
            <p className="text-sm text-muted-foreground">
              Processing verification
            </p>
          </div>
          {/* <Clock className="w-6 h-6 text-yellow-500" /> */}
          {ethers.toNumber(documentOB.status) === 0 && (
            <Clock className="w-6 h-6 text-yellow-500" />
          )}
          {ethers.toNumber(documentOB.status) === 1 && (
            <Check className="mr-2 h-4 w-4 text-green-500" />
          )}
          {ethers.toNumber(documentOB.status) === 2 && (
            <XCircle className="mr-2 h-4 w-4 text-red-500" />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Verification Progress</span>
            <span>{ethers.toNumber(documentOB.status) === 1 ?'100%':'60%'}</span>
          </div>
          <Progress
            value={ethers.toNumber(documentOB.status) === 1 ? 100 : 60}
            className="h-2"
          />
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Verification Steps</h4>
          <div className="space-y-2">
            {ethers.toNumber(documentOB.status) === 0 &&
              getStatusBadge("pending")}
            {ethers.toNumber(documentOB.status) === 1 &&
              getStatusBadge("success")}
            {ethers.toNumber(documentOB.status) === 2 &&
              getStatusBadge("failed")}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VerificationStatus;
