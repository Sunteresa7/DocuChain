const mongoose = require("mongoose");
const monogoURI= "mongodb+srv://sunterresa:iRqlOG4Pmv0rfsbR@cluster0.wor6stv.mongodb.net/documentVerification";

mongoose
  .connect(monogoURI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));