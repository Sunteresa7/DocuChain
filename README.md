# 📄 DocuChain – Decentralized Document Verification System

DocuChain is a secure, blockchain-based platform for verifying the authenticity of digital documents using Ethereum smart contracts and IPFS decentralized storage. Built as a Final Year Project for the Bachelor of Computer Science (Cybersecurity), it addresses the limitations of traditional centralized systems by enabling transparent, tamper-proof, and role-based verification.

## 🚀 Features

- ✅ **IPFS Integration** – Stores documents on decentralized infrastructure
- 🔐 **Ethereum Smart Contract** – Manages verification workflows and user roles
- 👤 **Role-Based Access Control** – Separate functionalities for User, Verifier, and Admin
- 📬 **OTP Email Verification** – Adds an additional layer of identity confirmation
- 🌐 **Auto-Verification Logic** – Instantly verifies pre-approved documents (Trusted CIDs)
- 🔗 **Public Sharing** – Generate accessible IPFS links for verified documents
- 📊 **Transaction History** – View verification status and download documents
- 🧪 **Fully Tested** – Includes unit, integration, and user acceptance testing (UAT)

## 🧱 Tech Stack

| Layer              | Technology                        |
|--------------------|------------------------------------|
| Frontend           | React.js, TypeScript, Tailwind CSS |
| Backend            | Node.js, Express.js, Nodemailer    |
| Blockchain         | Solidity, Ganache, Web3.js         |
| Storage            | IPFS (via Pinata)                  |
| Wallet Integration | MetaMask                          |

## 📂 Project Structure

📁 server/ # Backend server code
│ └── server.js
│ └── .env
│ └── contracts/
│ └── documentVerification.json
│
📁 verifichain-main/ # Frontend (React) application
│ └── src/
│ └── pages/
│ └── components/
│ └── abi/
│
📁 smart-contract/ # Solidity code (DocumentVerification.sol)

bash
Copy
Edit

## 🛠 Setup Instructions

### Prerequisites
- Node.js & npm
- Ganache (for local Ethereum blockchain)
- MetaMask browser extension
- MongoDB (optional for storing users)

### 1. Clone the Repo

git clone https://github.com/your-username/docuchain.git
cd docuchain

### 2. Install Dependencies
bash

cd server
npm install

cd ../verifichain-main
npm install

### 3. Configure Environment Variables
Create a .env file in the server/ directory with:

env
Copy
Edit
PINATA_API_KEY=your_pinata_key
PINATA_SECRET_API_KEY=your_pinata_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

### 4. Compile and Deploy Smart Contract
bash
Copy
Edit
truffle compile
truffle migrate --reset
Copy the deployed contract JSON (build/contracts/DocumentVerification.json) into:

server/contracts/

verifichain-main/src/abi/

### 5. Start the Application

# Terminal 1 - Backend
cd server
npm run start

# Terminal 2 - Frontend
cd ../verifichain-main
npm start

### 6. Open in Browser
Visit: http://localhost:3000
Ensure MetaMask is connected to Ganache's private network.

### 🧪 Testing Highlights
Unit Testing for Smart Contracts (Ganache)

Integration Testing across backend, IPFS, and Ethereum

UAT feedback implemented for UX improvements

### 📸 Screenshots
Refer to the FYP Report for architecture diagrams, dashboards, verifier panels, and system output.

### 📜 License
MIT License
