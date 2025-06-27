import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, Copy, CheckCircle2, Pencil, Power } from "lucide-react"; // Import Power icon for Logout
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBlockchain } from "@/contexts/blockchainContext";
import LiquidChrome from "@/components/LiquidChrome";

declare global {
  interface Window {
    ethereum?: any;
  }
}

const Profile = () => {
  const {account} = useBlockchain()
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSignedUp, setIsSignedUp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  useEffect(() => {
    const storedWalletAddress = localStorage.getItem("walletAddress");
    if (storedWalletAddress) {
      setIsConnected(true);
      setWalletAddress(storedWalletAddress);
      handleLogin(account);
    }
  }, []);

  useEffect(()=>{
    if(account){
      handleLogin(account);
    }
  },[account]);

  const handleLogout = () => {
    localStorage.clear();
    setIsConnected(false);
    setWalletAddress(null);
    setIsSignedUp(false);
    setName("");
    setEmail("");
    if (window.ethereum) {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
    }
    toast({ title: "Logged Out", description: "Disconnected from MetaMask", variant: "default" });
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) handleLogout();
    else if (accounts[0] !== walletAddress) {
      setWalletAddress(accounts[0]);
      localStorage.setItem("walletAddress", accounts[0]);
    }
  };

  const handleConnectWallet = async () => {
    try {
      if (!window.ethereum) {
        toast({ title: "MetaMask Not Installed", variant: "destructive" });
        return;
      }
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (accounts.length > 0) {
        const address = accounts[0];
        setIsConnected(true);
        setWalletAddress(address);
        localStorage.setItem("walletAddress", address);
        toast({ title: "Wallet Connected", variant: "default" });
        handleLogin(address);
      }
    } catch (error) {
      toast({ title: "Connection Failed", variant: "destructive" });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Address copied to clipboard", variant: "default" });
  };

  const handleSendOtp = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        toast({ title: "OTP Sent", description: data.message });
        setOtpSent(true);
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to send OTP", variant: "destructive" });
    }
  };

  const handleVerifyOtpAndSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsVerifyingOtp(true);
    try {
      const otpResponse = await fetch("http://localhost:3001/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: enteredOtp }),
      });
      const otpData = await otpResponse.json();
      if (otpData.verified) {
        await handleSignUpSubmit(event);
      } else {
        toast({ title: "Invalid OTP", description: otpData.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "OTP verification failed", variant: "destructive" });
    }
    setIsVerifyingOtp(false);
  };

  const handleSignUpSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSignedUp(true);
    localStorage.setItem("isSignedUp", "true");
    await fetch("http://localhost:3001/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, address: account }),
    });
    toast({ title: "Signed Up!", description: `Profile created.`, variant: "default" });
    handleLogin(account);
  };

  const handleLogin = async (address) => {
    try {
      const response = await fetch("http://localhost:3001/api/signIn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: String(address).toLowerCase() }),
      });
      const data = await response.json();
      if (data.data) {
        setName(data.data.name || "");
        setEmail(data.data.email || "");
        setWalletAddress(data.data.address);
        setIsSignedUp(true);
        localStorage.setItem("walletAddress", data.data.address);
        localStorage.setItem("isSignedUp", "true");
      } else {
        setIsSignedUp(false);
        setName("");
        setEmail("");
      }
    } catch {
      toast({ title: "Error", description: "Login failed", variant: "destructive" });
    }
  };

  const handleEditProfile = () => setIsSignedUp(false);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-2xl mx-auto">
      <Card className="mb-6">
        <CardHeader><CardTitle>Profile Information</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          {isSignedUp ? (
            <>
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <Label>Name</Label><p>{name}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleEditProfile}><Pencil className="w-4 h-4" /></Button>
              </div>
              <div className="space-y-2">
                <Label>Email</Label><p>{email}</p>
              </div>
            </>
          ) : isConnected && (
            <div className="space-y-4 mt-6 border-t pt-6">
              <h4 className="font-medium">Sign Up</h4>
              <form onSubmit={otpSent ? handleVerifyOtpAndSignup : (e) => e.preventDefault()} className="space-y-4">
                <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                {!otpSent ? (
                  <Button type="button" onClick={handleSendOtp}>Send OTP</Button>
                ) : (
                  <>
                    <div className="space-y-2"><Label>OTP</Label><Input value={enteredOtp} onChange={(e) => setEnteredOtp(e.target.value)} /></div>
                    <Button type="submit" disabled={isVerifyingOtp}>{isVerifyingOtp ? "Verifying..." : "Verify & Sign Up"}</Button>
                  </>
                )}
              </form>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Wallet Connection</CardTitle></CardHeader>
        <CardContent>
          {!isConnected ? (
            <div className="text-center py-6">
              <Wallet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">Connect your MetaMask wallet to verify documents</p>
              <Button onClick={handleConnectWallet}><Wallet className="w-4 h-4" /> Connect MetaMask</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-500"><CheckCircle2 className="w-5 h-5" /><span>Wallet Connected</span></div>
                <Button variant="destructive" size="sm" onClick={handleLogout}><Power className="w-4 h-4" /> Log Out</Button>
              </div>
              <div className="space-y-2">
                <Label>Wallet Address</Label>
                <div className="flex items-center gap-2"><code>{account}</code>
                  <Button variant="outline" size="icon" onClick={() => account && copyToClipboard(account)}><Copy className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Profile;