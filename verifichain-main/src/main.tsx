import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BlockchainProvider } from "./contexts/blockchainContext.tsx";

createRoot(document.getElementById("root")!).render(<BlockchainProvider><App /></BlockchainProvider>);
