const router = require("express").Router();
const userRouter = require("./user.route");

router.use("/api", userRouter);

module.exports = router;
