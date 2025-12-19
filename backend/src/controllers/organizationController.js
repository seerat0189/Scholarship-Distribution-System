const prisma = require("../models/prismaClient.js");

module.exports.createScholarship = async (req, res) => {
  // Destructure new fields from req.body
  const { scholarshipName, eligibility, amount, minimumCgpa, testMode, testQuestionId, status } = req.body;
  const organizationId = req.user.id; 

  // --- START OF FIX ---

  // 1. Validate 'amount'. It's required.
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount)) {
    return res.status(400).json({ message: "Amount must be a valid number." });
  }

  // 2. Validate 'minimumCgpa'. It's optional.
  // If it's an empty string "" or undefined, it becomes null.
  // If it's a number, it's parsed.
  // If it's invalid text ("abc"), it becomes null.
  const parsedCgpa = parseFloat(minimumCgpa);
  const finalCgpa = isNaN(parsedCgpa) ? null : parsedCgpa;

  // 3. Validate status (optional). Accepts UPCOMING, ACTIVE, CLOSED (case-insensitive)
  const allowedStatuses = ["UPCOMING", "ACTIVE", "CLOSED"];
  let finalStatus = undefined; // let Prisma use default if not provided
  if (typeof status !== "undefined" && status !== null) {
    const s = String(status).toUpperCase();
    if (!allowedStatuses.includes(s)) {
      return res.status(400).json({ message: `Invalid status. Allowed: ${allowedStatuses.join(", ")}` });
    }
    finalStatus = s;
  }

  // --- END OF FIX ---

  try {
    const scholarship = await prisma.scholarship.create({
      data: {
        scholarshipName,
        eligibility: eligibility || null,
        amount: parsedAmount,
        minimumCgpa: finalCgpa,
        organizationId: organizationId,
        // status: if provided use it, otherwise let Prisma default
        ...(finalStatus ? { status: finalStatus } : {}),
        testMode: testMode || false,
        testQuestionId: testMode ? testQuestionId : null,
      },
    });
    res.json(scholarship);
  } catch (error) {
   console.error("Error creating scholarship:", error); 
    res.status(500).json({ error: "Server Error", message: error.message });
  }
};

module.exports.viewApplicants = async (req, res) => {
  const { scholarshipId } = req.params;
  const organizationId = req.user.id; // The logged-in organization

  try {
    // SECURITY CHECK: Ensure the scholarship belongs to this organization
    const scholarship = await prisma.scholarship.findUnique({
      where: { id: parseInt(scholarshipId) },
      select: { organizationId: true, scholarshipName: true }
    });
    
    if (!scholarship || scholarship.organizationId !== organizationId) {
      return res.status(403).json({ message: "Access denied: You do not own this scholarship." });
    }

    const applicants = await prisma.application.findMany({
      where: { scholarshipId: parseInt(scholarshipId) },
      include: { 
        user: {
          select: { name: true, email: true, cgpa: true, college: true, degree: true } // Select only safe user fields
        },
        scholarship: {
          select: { scholarshipName: true }
        }
      },
    });
    res.json(applicants);
  } catch (error) {
     res.status(500).json({ error: error.message });
  }
};

// ... (at the bottom of the file)
module.exports.getMyScholarships = async (req, res) => {
  const organizationId = req.user.id;
  try {
    const scholarships = await prisma.scholarship.findMany({
      where: { organizationId: organizationId },
    });
    res.json(scholarships);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Allow an organization to update a scholarship's status
module.exports.updateScholarshipStatus = async (req, res) => {
  const { id } = req.params; // scholarship id
  const { status } = req.body;
  const organizationId = req.user.id;

  if (!status) {
    return res.status(400).json({ message: "Status is required" });
  }

  const allowedStatuses = ["UPCOMING", "ACTIVE", "CLOSED"];
  const s = String(status).toUpperCase();
  if (!allowedStatuses.includes(s)) {
    return res.status(400).json({ message: `Invalid status. Allowed: ${allowedStatuses.join(", ")}` });
  }

  try {
    // Ensure the scholarship exists and belongs to this organization
    const scholarship = await prisma.scholarship.findUnique({ where: { id: parseInt(id) } });
    if (!scholarship) return res.status(404).json({ message: "Scholarship not found" });
    if (scholarship.organizationId !== organizationId) {
      return res.status(403).json({ message: "Access denied: you do not own this scholarship" });
    }

    const updated = await prisma.scholarship.update({
      where: { id: parseInt(id) },
      data: { status: s },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- ADD THIS NEW FUNCTION ---
module.exports.updateApplicationStatus = async (req, res) => {
  const { applicationId } = req.params;
  const { status } = req.body; // "Accepted" or "Rejected"
  const organizationId = req.user.id;

  if (!status || !["Accepted", "Rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    // SECURITY CHECK: Ensure the org owns the scholarship this application is for
    const application = await prisma.application.findUnique({
      where: { id: parseInt(applicationId) },
      include: { scholarship: true },
    });

    if (!application || application.scholarship.organizationId !== organizationId) {
      return res.status(403).json({ message: "Access denied: You do not own this scholarship." });
    }

    // All checks passed, update the application
    const updatedApplication = await prisma.application.update({
      where: { id: parseInt(applicationId) },
      data: { status: status },
    });

    res.json(updatedApplication);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};