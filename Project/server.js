require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('./generated/prisma');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24*60*60*1000 }
}));

app.use(express.static(path.join(__dirname, 'public')));


function requireUser(req, res, next) {
  if (req.session && req.session.user && req.session.user.type === 'USER') return next();
  return res.status(401).json({ error: 'Login required as user.' });
}

app.get('/api/profile', requireUser, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const profiles = await prisma.profile.findMany({ where: { userId }});
    res.json(profiles);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

app.get('/api/scholarships', async (req, res) => {
  try {
    const scholarships = await prisma.scholarship.findMany({
      include: {
        organisation: true,
        applications: {
          select: {
            userId: true,
            status: true
          }
        }
      }
    });
    res.json(scholarships);
  } catch(err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch scholarships' });
  }
});

app.post('/api/scholarship/:id/apply', requireUser, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const scholarshipId = parseInt(req.params.id);

    const profiles = await prisma.profile.findMany({ where: { userId }});
    if (!profiles || profiles.length === 0) {
      return res.status(400).json({ message: 'Please save your profile before applying.' });
    }

    const existing = await prisma.application.findFirst({ where: { userId, scholarshipId }});
    if (existing) return res.status(400).json({ message: 'Already applied to this scholarship' });

    const application = await prisma.application.create({
      data: { userId, scholarshipId }
    });
    res.status(201).json({ message: 'Application submitted', application });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

app.post('/api/application/:id/decision', requireOrg, async (req, res) => {
  try {
    const appId = parseInt(req.params.id);
    const { decision } = req.body;
    if (!['approved','rejected'].includes(decision)) return res.status(400).json({ message: 'Invalid decision' });

    const application = await prisma.application.findUnique({ where: { id: appId }, include: { scholarship: true }});
    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (application.scholarship.organisationId !== req.session.user.id) return res.status(403).json({ message: 'Forbidden' });

    const updated = await prisma.application.update({ where: { id: appId }, data: { status: decision }});
    res.json({ message: 'Application updated', application: updated });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

app.get("/auth/status", (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, type: req.session.user.type, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});


// start
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
