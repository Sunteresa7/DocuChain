import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, XCircle, DownloadCloud, Share2 } from "lucide-react";
import { ethers } from "ethers";
import moment from "moment";
import download from "downloadjs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useBlockchain } from "@/contexts/blockchainContext"; // ✅ NEW

export interface Transaction {
  hash: string;
  address: string;
  documentName: string;
  verifier: string;
  status: "success" | "pending" | "failed";
  timeStamp: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions }) => {
  const { toast } = useToast();
  const { account } = useBlockchain(); // ✅ NEW

  // ✅ Filter transactions belonging only to the logged-in user
  const filteredTransactions = transactions.filter(
    (transaction) => transaction.address.toLowerCase() === account?.toLowerCase()
  );

  const getStatusBadge = (status: Transaction["status"]) => {
    if (status === "success") {
      return (
        <Badge variant="outline">
          <Check className="mr-2 h-4 w-4 text-green-500" /> Success
        </Badge>
      );
    } else if (status === "pending") {
      return (
        <Badge variant="secondary">
          <Clock className="mr-2 h-4 w-4 animate-spin text-yellow-500" /> Pending
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

  const getFileNameForHash = async (hash) => {
    const response = await fetch("http://localhost:3001/GetFileName/" + hash);
    const data = await response.json().catch((err) => console.log(err));
    if (!data || !data.name) return "Upload failed. Try again later.";
    return data.name;
  };

  const downloadFile = async (hash) => {
    const name = await getFileNameForHash(hash);
    const x = new XMLHttpRequest();
    const url = "http://localhost:3001/downloadVerifyDocument/" + hash;
    x.open("GET", url, true);
    x.responseType = "blob";
    x.onload = function (e: any) {
      download(e.target.response, name, "image/png");
    };
    x.send();
  };

  const handleShare = async (hash) => {
    try {
      const res = await fetch(`http://localhost:3001/api/generate-share-link/${hash}`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.shareLink) {
        navigator.clipboard.writeText(data.shareLink);
        toast({ title: "Link Copied!", description: data.shareLink });
      } else {
        toast({ title: "Error", description: "Failed to generate link", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Server Error", variant: "destructive" });
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Transaction ID</TableHead>
          <TableHead>User Address</TableHead>
          <TableHead>Document Name</TableHead>
          <TableHead>Date & Time</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Download</TableHead>
          <TableHead>Share</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredTransactions.map((transaction, index) => (
          <TableRow key={index}>
            <TableCell className="font-medium">Tnx-{index}</TableCell>
            <TableCell>{transaction.address}</TableCell>
            <TableCell>{transaction.documentName}</TableCell>
            <TableCell>
              {moment
                .unix(ethers.toNumber(transaction.timeStamp))
                .format("YYYY-MM-DD HH:mm")}
            </TableCell>
            <TableCell>
              {ethers.toNumber(transaction.status) === 0
                ? getStatusBadge("pending")
                : ethers.toNumber(transaction.status) === 1
                ? getStatusBadge("success")
                : ethers.toNumber(transaction.status) === 2
                ? getStatusBadge("failed")
                : null}
            </TableCell>
            <TableCell>
              <DownloadCloud
                className="mr-2 cursor-pointer"
                onClick={() => downloadFile(transaction.hash)}
              />
            </TableCell>
            <TableCell>
              {ethers.toNumber(transaction.status) === 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare(transaction.hash)}
                >
                  <Share2 className="h-4 w-4 mr-2" /> Share
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
        {filteredTransactions.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-4 italic text-muted-foreground">
              No transaction history yet. Upload documents to start.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default TransactionHistory;
