import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Home, FileText, User, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useBlockchain } from "@/contexts/blockchainContext";

interface DockItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const DockItem: React.FC<DockItemProps> = ({
  icon,
  label,
  isActive,
  onClick,
}) => (
  <motion.button
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={cn(
      "flex flex-col items-center gap-1 p-3 rounded-xl transition-colors",
      isActive
        ? "text-primary bg-background/80"
        : "text-muted-foreground hover:text-primary hover:bg-background/50"
    )}
  >
    {icon}
    <span className="text-xs font-medium">{label}</span>
  </motion.button>
);

// **DockProps Interface - VERY IMPORTANT - Check this part CAREFULLY**
export interface DockProps {
  activePage: "home" | "documents" | "profile" | "verifier" | "addVerifier" | "trustedCID";
  onNavigate: (page: "home" | "documents" | "profile" | "trustedCID") => void;
  className?: string; // **Ensure className?: string; is present and exported**
}

const Dock: React.FC<DockProps> = ({ activePage, onNavigate, className }) => {
  const { contract, account } = useBlockchain();
  const [isOwner, setIsOwner] = useState(false);
  const [isVerifier, setIsVerifier] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    if (account && contract) {
      getOwner();
      getVerifier();
    }
  }, [account]);
  const getOwner = async () => {
    try {
      const result = await contract.owner();
      setIsOwner(result === account);
    } catch (error) {
      console.log(error);
    }
  };
  const getVerifier = async () => {
    try {
      const result = await contract.isVerifier(account);
      setIsVerifier(result);
    } catch (error) {
      console.log(error);
    }
  };
  const handleNavigateToVerifier = () => {
    navigate("verifier");
  };
  const handleNavigateToAddVerifier = () => {
    navigate("addVerifier");
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "fixed bottom-2 left-1/1.5 -translate-x-1/2 px-6 py-3 rounded-2xl shadow-lg border bg-background/80 backdrop-blur-lg w-fit z-50",
        className // Apply className prop here
      )}
    >
      {isOwner ? (
  <div className="flex items-center gap-2 px-6">
    <DockItem
      icon={<Home className="w-6 h-6" />}
      label="Home"
      isActive={activePage === "home"}
      onClick={() => onNavigate("home")}
    />
    <DockItem
      icon={<FileText className="w-6 h-6" />}
      label="Verifier"
      isActive={activePage === "verifier"}
      onClick={handleNavigateToVerifier}
    />
    <DockItem
      icon={<FileText className="w-6 h-6" />}
      label="Add Verifier"
      isActive={activePage === "addVerifier"}
      onClick={handleNavigateToAddVerifier}
    />
    <DockItem
      icon={<ShieldCheck className="w-6 h-6" />}
      label="Trusted CID"
      isActive={activePage === "trustedCID"}
      onClick={() => navigate("/trustedCID")}
    />
    <DockItem
      icon={<FileText className="w-6 h-6" />}
      label="Documents"
      isActive={activePage === "documents"}
      onClick={() => onNavigate("documents")}
    />
    <DockItem
      icon={<User className="w-6 h-6" />}
      label="Profile"
      isActive={activePage === "profile"}
      onClick={() => onNavigate("profile")}
    />
  </div>
      ) : isVerifier ? (
        <div className="flex items-center gap-2 px-6">
          <DockItem
            icon={<Home className="w-6 h-6" />}
            label="Home"
            isActive={activePage === "home"}
            onClick={() => onNavigate("home")}
          />
          <DockItem
            icon={<FileText className="w-6 h-6" />}
            label="Verifier"
            isActive={activePage === "verifier"}
            onClick={handleNavigateToVerifier}
          />
          <DockItem
            icon={<User className="w-6 h-6" />}
            label="Profile"
            isActive={activePage === "profile"}
            onClick={() => onNavigate("profile")}
          />
        </div>
      ) : (
        <div className="flex items-center gap-2 px-6">
          <DockItem
            icon={<Home className="w-6 h-6" />}
            label="Home"
            isActive={activePage === "home"}
            onClick={() => onNavigate("home")}
          />
          {
            account && <DockItem
            icon={<FileText className="w-6 h-6" />}
            label="Documents"
            isActive={activePage === "documents"}
            onClick={() => onNavigate("documents")}
          />
          }
          <DockItem
            icon={<User className="w-6 h-6" />}
            label="Profile"
            isActive={activePage === "profile"}
            onClick={() => onNavigate("profile")}
          />
        </div>
      )}
    </motion.div>
  );
};

export default Dock;
