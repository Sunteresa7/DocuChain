const UserModel = require("../models/user.model");

exports.register = async (req, res) => {
    const { email, name, address } = req.body;
    try {
      const result = await UserModel.findOneAndUpdate(
        { address },
        { email, name ,address},
        { new: true, upsert: true } // create if not exist, return the new document
      );
      res.status(200).json({ error: false, message: "Successfully Registered User!", result });
    } catch (error) {
      res.status(500).json({ error: true, message: "Server Error", details: error });
    }
  };

exports.signIn = async (req, res) => {
    try {
      const { address } = req.body;
      const data = await UserModel.findOne({ address });
  
      res.status(200).json({ error: false, message: "Successfully Signed In!", data });
    } catch (error) {
      res.status(500).json({ error: true, message: "Server Error", details: error });
    }
  };
