
require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/database");
const {
  startOrderReservationService,
} = require("./services/orderReservationService");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  // Start automatic expiry checks after MongoDB connects.
  startOrderReservationService();

  app.listen(PORT, () => {
    console.log(`Enterprise E-commerce API running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
};

startServer();
