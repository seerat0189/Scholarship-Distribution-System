import prisma from "../models/prismaClient.js";

export const getScholarships = async (req, res) => {
  const scholarships = await prisma.scholarship.findMany({
    include: { company: true },
  });
  res.json(scholarships);
};

export const applyForScholarship = async (req, res) => {
  const { scholarshipId } = req.body;
  const userId = req.user.id;
  await prisma.application.create({
    data: { scholarshipId, userId },
  });
  res.json({ message: "Applied successfully" });
};
