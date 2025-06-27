const express = require("express");
const router = require("./routes");
require("dotenv").config();
require("./config/db");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const Web3 = require("web3");
const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const axios = require('axios');
const FormData = require('form-data');
const documentVerificationContract = require("./contracts/documentVerification.json");

const app = express();
const port = process.env.PORT || 3001;

const FileType = require("file-type"); // ✅ Add this import

const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));
let documentVerification_contract = null;
const OTPStore = {};
const tokenStore = {};

app.use(cors());
app.use(express.json());
app.use(router);
app.use(fileUpload({ limits: { fileSize: 10 * 1024 * 1024 } }));

// Backend only uploads to IPFS now
app.post("/UploadDocumentVerify/", async (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No files were uploaded.");
  }

  const documentVerify = req.files.documentVerify;
  const formData = new FormData();
  formData.append('file', documentVerify.data, {
    filename: documentVerify.name,
    contentType: documentVerify.mimetype,
  });

  try {
    const response = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
      maxBodyLength: "Infinity",
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
        'pinata_api_key': process.env.PINATA_API_KEY,
        'pinata_secret_api_key': process.env.PINATA_SECRET_API_KEY,
      },
    });

    const ipfsHash = response.data.IpfsHash;
    // Save filename mapping
    const record = { cid: ipfsHash, name: documentVerify.name, timestamp: Math.floor(Date.now() / 1000) };
    fs.appendFileSync("filemap.json", JSON.stringify(record) + "\n");
    res.send({ hash: ipfsHash, name: documentVerify.name });

  } catch (error) {
    console.error("❌ IPFS Upload Error:", error.message || error);
    res.status(500).send("IPFS upload failed.");
  }
});

app.get("/downloadVerifyDocument/:cid", async (req, res) => {
  const { cid } = req.params;
  try {
    const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${cid}`, {
      responseType: "arraybuffer",
    });

    // Attempt to get file name from mapping (optional)
    const lines = fs.readFileSync("filemap.json", "utf-8").split("\n");
    let fileName = cid;
    for (let line of lines) {
      if (line.trim()) {
        const record = JSON.parse(line);
        if (record.cid === cid) {
          fileName = record.name;
          break;
        }
      }
    }

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", response.headers['content-type'] || "application/octet-stream");
    res.send(response.data);
  } catch (error) {
    console.error("❌ Download error:", error.message);
    res.status(404).send("File not found or unreadable.");
  }
});

app.get("/api/trusted-cids", async (req, res) => {
  try {
    const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));
    const networkId = await web3.eth.net.getId();
    const deployedNetwork = documentVerificationContract.networks[networkId];

    if (!deployedNetwork) {
      return res.status(500).json({ message: "Contract not deployed on current network" });
    }

    const contract = new web3.eth.Contract(
      documentVerificationContract.abi,
      deployedNetwork.address
    );

    const lines = fs.readFileSync("filemap.json", "utf-8").split("\n");
    const results = [];

    for (let line of lines) {
      if (line.trim()) {
        const { cid, name, timestamp } = JSON.parse(line);
        const isTrusted = await contract.methods.isTrustedCID(cid).call();
        if (isTrusted) {
           // Approx timestamp
          results.push({ cid, name, timestamp });
        }
      }
    }

    res.json(results);
  } catch (err) {
    console.error("❌ Error in /api/trusted-cids:", err.message || err);
    res.status(500).json({ message: "Error reading trusted CIDs" });
  }
});



// Generate shareable link
app.post("/api/generate-share-link/:hash", (req, res) => {
  const { hash } = req.params;
  const shareLink = `https://gateway.pinata.cloud/ipfs/${hash}`;
  res.json({ shareLink });
});

// Serve shared document
app.get("/api/shared-document/:token", (req, res) => {
  const { token } = req.params;
  res.redirect(`https://gateway.pinata.cloud/ipfs/${token}`);
});

app.get("/GetFileName/:cid", (req, res) => {
  const { cid } = req.params;
  try {
    const lines = fs.readFileSync("filemap.json", "utf-8").split("\n");
    for (let line of lines) {
      if (line.trim()) {
        const record = JSON.parse(line);
        if (record.cid === cid) return res.json({ name: record.name });
      }
    }
    res.status(404).json({ message: "File not found" });
  } catch (error) {
    console.error("❌ GetFileName Error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
});

app.post("/api/send-otp", async (req, res) => {
  const { email } = req.body;
  const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });
  OTPStore[email] = otp;
  const mailOptions = {
    from: "your_email@gmail.com",
    to: email,
    subject: "Your DocuChain OTP Code",
    text: `Your OTP code is: ${otp}. It will expire in 5 minutes.`,
  };
  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "OTP sent to your email" });
  } catch (err) {
    res.status(500).json({ message: "Error sending OTP", error: err });
  }
});

app.post("/api/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  if (OTPStore[email] && OTPStore[email] === otp) {
    delete OTPStore[email];
    res.json({ verified: true });
  } else {
    res.status(400).json({ verified: false, message: "Invalid OTP" });
  }
});

app.listen(port, async () => {
  const networkId = await web3.eth.net.getId();
  const deployedNetwork = documentVerificationContract.networks[networkId];
  documentVerification_contract = new web3.eth.Contract(
    documentVerificationContract.abi,
    deployedNetwork && deployedNetwork.address
  );
  console.log("Express Listening at http://localhost:" + port);
});