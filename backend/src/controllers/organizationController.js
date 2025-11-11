const prisma = require("../models/prismaClient.js");

module.exports.createScholarship = async (req, res) => {
  // Destructure new fields from req.body
  const { scholarshipName, eligibility, amount, minimumCgpa, testMode, testQuestionId } = req.body;
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

  // --- END OF FIX ---

  try {
    const scholarship = await prisma.scholarship.create({
      data: {
        scholarshipName,
        eligibility: eligibility || null,
        amount: parseFloat(amount),
        minimumCgpa: minimumCgpa ? parseFloat(minimumCgpa) : null,
        organizationId: organizationId,
        // --- ADD THESE LINES ---
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
const applicants = await prisma.application.findMany({
      where: { scholarshipId: parseInt(scholarshipId) },
      include: { 
        user: {
          select: { name: true, email: true, cgpa: true, college: true, degree: true } // Select only safe user fields
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