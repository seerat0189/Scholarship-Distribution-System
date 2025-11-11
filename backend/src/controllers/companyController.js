import prisma from "../models/prismaClient.js";

export const createScholarship = async (req, res) => {
  const { title, description, amount, deadline } = req.body;
  const companyId = req.user.id;
  const scholarship = await prisma.scholarship.create({
    data: { title, description, amount: parseFloat(amount), deadline: new Date(deadline), companyId },
  });
  res.json(scholarship);
};

export const viewApplicants = async (req, res) => {
  const { scholarshipId } = req.params;
  const applicants = await prisma.application.findMany({
    where: { scholarshipId: parseInt(scholarshipId) },
    include: { user: true },
  });
  res.json(applicants);
};
