const express = require("express");
const router = express.Router();

const {
  getAllLeads,
  createLead,
  getLeadById,
  updateLead,
  deleteLead,
} = require("../controllers/leadController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

router.use(protect, authorizeRoles("admin"));

router.route("/")
  .get(getAllLeads)
  .post(createLead);

router.route("/:id")
  .get(getLeadById)
  .patch(updateLead)
  .delete(deleteLead);

module.exports = router;
