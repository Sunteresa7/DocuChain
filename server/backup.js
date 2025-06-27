const express = require("express");
const router = require("./routes");
require("./config/db");
const app = express();
const port = 3001 || process.env.PORT;
const Web3 = require("web3");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const documentVerificationContract = require("./contracts/documentVerification.json");
const glob = require("glob");
const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");
const OTPStore = {};
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const tokenStore = {};
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));

let documentVerification_contract = null;

app.use(cors());
app.use(express.json());
app.use(router);
app.use(
  fileUpload({
    limits: { fileSize: 10 * 1024 * 1024 },
  })
);

// POST a new medical record
app.post("/UploadDocumentVerify/", (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No files were uploaded.");
  }

  let documentVerify = req.files.documentVerify;
  console.log(documentVerify.md5);
  documentVerify.mv(
    "./document-verification-records/" +
      documentVerify.md5 +
      "_" +
      documentVerify.name,
    function (err) {
      if (err) return res.status(500).send(err);
    }
  );
  res.send({ hash: documentVerify.md5 });
});

// GET the name of a file
app.get("/GetFileName/:hash", (req, res) => {
  const hash = req.params.hash;
  glob("./document-verification-records/" + hash + "*", (err, files) => {
    if (err) return res.status(404).send("no file found for hash " + hash);
    if (!files[0]) res.status(404).send("no file found for hash " + hash);
    res.send({ name: files[0].split("./document-verification-records/")[1] });
  });
});

// GET a document
app.get(
  "/DownloadVerifyDocuments/:user/:patient/:document",
  async (req, res) => {
    const documentHash = req.params.document;
    const userAddress = req.params.user;
    const patientAddress = req.params.patient;

    try {
      const doctorPermissions = await documentVerification_contract.methods
        .getDoctorsPermissions(userAddress)
        .call();
      console.log(doctorPermissions);
      if (
        !doctorPermissions.includes(patientAddress) &&
        userAddress != patientAddress
      )
        return res.send("Access denied!");

      const documents = await documentVerification_contract.methods
        .getDocuments(patientAddress)
        .call();
      console.log(documents);
      if (!documents.includes(documentHash))
        return res.send(
          "This document doesn't belong to the specified patient!"
        );
    } catch (err) {
      return res.send("Access denied!");
    }

    console.log("trying to download " + documentHash);
    glob(
      "./document-verification-records/" + documentHash + "*",
      (err, files) => {
        if (err)
          return res.status(404).send("no file found for hash " + documentHash);

        res.download(files[0]);
      }
    );
  }
);

app.get('/downloadVerifyDocument/:documentHash',async (req,res)=>{
  try {
    const documentHash = req.params.documentHash;
    glob(
      "./document-verification-records/" + documentHash + "*",
      (err, files) => {
        if (err)
          return res.status(404).send("no file found for hash " + documentHash);

        res.download(files[0]);
      }
    );
  } catch (error) {
    res.status(500).json({error:true,message:'Internal Server Error!'}); 
  }
});

app.listen(port, async () => {
  const networkId = await web3.eth.net.getId();
  const deployedNetwork = documentVerificationContract.networks[networkId];
  console.log("deployment network: " + deployedNetwork);
  documentVerification_contract = new web3.eth.Contract(
    documentVerificationContract.abi,
    deployedNetwork && deployedNetwork.address
  );
  console.log("Express Listening at http://localhost:" + port);
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "sunterresa@gmail.com",
    pass: "rmewkwgxtjynyzky"
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

// Generate shareable link based on document hash
app.post("/api/generate-share-link/:hash", async (req, res) => {
  const { hash } = req.params;

  const fileDir = path.join(__dirname, "document-verification-records");
  const files = fs.readdirSync(fileDir);
  const matchingFile = files.find(file => file.includes(hash));

  if (!matchingFile) {
    return res.status(404).json({ message: "Document not found for hash" });
  }

  const token = crypto.randomBytes(16).toString("hex");
  tokenStore[token] = matchingFile;

  const shareLink = `http://localhost:5173/share/${token}`;
  res.json({ shareLink });
});

// Serve shared document via token
app.get("/api/shared-document/:token", (req, res) => {
  const { token } = req.params;
  const filename = tokenStore[token];

  if (!filename) {
    return res.status(404).json({ message: "Invalid or expired token" });
  }

  const filePath = path.join(__dirname, "document-verification-records", filename);
  res.sendFile(filePath);
});
