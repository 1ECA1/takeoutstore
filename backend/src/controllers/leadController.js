const mongoose = require("mongoose");
const Lead = require("../models/Lead");
const User = require("../models/User");

const getAllLeads = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const search = String(req.query.search || "").trim();
    const status = String(req.query.status || "").trim();

    const filter = {};

    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
      ];
    }

    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .populate("assignedTo", "name email")
        .populate("convertedCustomer", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Lead.countDocuments(filter),
    ]);

    res.status(200).json({
      status: "success",
      results: leads.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: leads,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve leads",
    });
  }
};

const createLead = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      source,
      status,
      assignedTo,
      notes,
    } = req.body;

    if (!name || (!email?.trim() && !phone?.trim())) {
      return res.status(400).json({
        status: "error",
        message: "Name and at least an email address or phone number are required",
      });
    }

    if (assignedTo) {
      if (!mongoose.isValidObjectId(assignedTo)) {
        return res.status(400).json({
          status: "error",
          message: "Invalid staff assignment",
        });
      }

      const staff = await User.findOne({
        _id: assignedTo,
        role: "staff",
        status: "active",
      });

      if (!staff) {
        return res.status(400).json({
          status: "error",
          message: "Assigned user must be an active staff member",
        });
      }
    }

    const lead = await Lead.create({
      name,
      email,
      phone,
      company,
      source,
      status,
      assignedTo: assignedTo || null,
      notes,
    });

    res.status(201).json({
      status: "success",
      data: lead,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

const getLeadById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid lead ID",
      });
    }

    const lead = await Lead.findById(req.params.id)
      .populate("assignedTo", "name email")
      .populate("convertedCustomer", "name email");

    if (!lead) {
      return res.status(404).json({
        status: "error",
        message: "Lead not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: lead,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve lead",
    });
  }
};

const updateLead = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid lead ID",
      });
    }

    const allowedFields = [
      "name",
      "email",
      "phone",
      "company",
      "source",
      "status",
      "assignedTo",
      "notes",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (updates.name !== undefined && !String(updates.name).trim()) {
      return res.status(400).json({
        status: "error",
        message: "Lead name cannot be empty",
      });
    }

    if (
      updates.assignedTo &&
      !mongoose.isValidObjectId(updates.assignedTo)
    ) {
      return res.status(400).json({
        status: "error",
        message: "Invalid staff assignment",
      });
    }

    if (updates.assignedTo) {
      const staff = await User.findOne({
        _id: updates.assignedTo,
        role: "staff",
        status: "active",
      });

      if (!staff) {
        return res.status(400).json({
          status: "error",
          message: "Assigned user must be an active staff member",
        });
      }
    }

    if (updates.assignedTo === "") {
      updates.assignedTo = null;
    }

    const existingLead = await Lead.findById(req.params.id);

    if (!existingLead) {
      return res.status(404).json({
        status: "error",
        message: "Lead not found",
      });
    }

    const nextEmail =
      updates.email !== undefined ? updates.email : existingLead.email;
    const nextPhone =
      updates.phone !== undefined ? updates.phone : existingLead.phone;

    if (!String(nextEmail || "").trim() && !String(nextPhone || "").trim()) {
      return res.status(400).json({
        status: "error",
        message: "A lead must have an email address or phone number",
      });
    }

    Object.assign(existingLead, updates);
    await existingLead.save();

    res.status(200).json({
      status: "success",
      data: existingLead,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

const deleteLead = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid lead ID",
      });
    }

    const lead = await Lead.findByIdAndDelete(req.params.id);

    if (!lead) {
      return res.status(404).json({
        status: "error",
        message: "Lead not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Lead deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to delete lead",
    });
  }
};

module.exports = {
  getAllLeads,
  createLead,
  getLeadById,
  updateLead,
  deleteLead,
};