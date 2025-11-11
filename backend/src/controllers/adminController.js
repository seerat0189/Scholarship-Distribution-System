import prisma from "../models/prismaClient.js";

export const getAllUsers = async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
};

export const getAllScholarships = async (req, res) => {
  const scholarships = await prisma.scholarship.findMany({ include: { company: true } });
  res.json(scholarships);
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  await prisma.user.delete({ where: { id: parseInt(id) } });
  res.json({ message: "User deleted successfully" });
};
