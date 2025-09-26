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
function requireOrg(req, res, next) {
  if (req.session && req.session.user && req.session.user.type === 'ORG') return next();
  return res.status(401).json({ error: 'Login required as organisation.' });
}

app.get('/api/profile', requireUser, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const profiles = await prisma.profile.findMany({ where: { userId }});
    res.json(profiles);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});
 // Organisation register
app.post('/api/org/register', async (req, res) => {
  try {
    const { name, website_link, registration_id, password } = req.body;
    if (!name || !website_link || !registration_id || !password)
      return res.status(400).json({ message: 'Missing fields' });

    const exists = await prisma.organisation.findUnique({ where: { registration_id } });
    if (exists)
      return res.status(400).json({ message: 'Organisation already exists with this registration id' });

    // Hash the password
    const hashed = await bcrypt.hash(password, 10);

    // Store in database (ensure your Prisma schema has password field!)
    const org = await prisma.organisation.create({
        data: { name, website_link, registration_id, password: hashed }
    });


    // Save session
    req.session.user = { id: org.id, type: 'ORG', registration_id, name: org.name };
    res.status(201).json({
      message: 'Organisation registered successfully',
      organisation: { id: org.id, name: org.name, registration_id }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


// Organisation login
app.post('/api/org/login', async (req, res) => {
  try {
    const { registration_id, password } = req.body;
    const org = await prisma.organisation.findUnique({ where: { registration_id } });
    if (!org) return res.status(400).json({ message: 'Invalid credentials' });

    // Compare password with hashed password in DB
    const ok = await bcrypt.compare(password, org.password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

    // Save session
    req.session.user = { id: org.id, type: 'ORG', registration_id, name: org.name };
    res.json({
      message: 'Organisation login successful',
      organisation: { id: org.id, name: org.name, registration_id }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ message: 'Logged out' }));
});
// Post scholarship (organisation)
app.post('/api/scholarship', requireOrg, async (req, res) => {
  try {
    const orgId = req.session.user.id;
    const { scholarship_name, eligibility, amount, minimum_cgpa } = req.body;
    if (!scholarship_name || !amount) return res.status(400).json({ message: 'scholarship_name & amount required' });

    const s = await prisma.scholarship.create({
      data: {
        scholarship_name,
        eligibility: eligibility || '',
        minimum_cgpa: minimum_cgpa ? parseFloat(minimum_cgpa) : null,
        amount: parseFloat(amount),
        organisationId: orgId
      }
    });
    res.status(201).json({ message: 'Scholarship posted', scholarship: s });
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

// Organisation: list applications for all scholarships of this org
app.get('/api/org/:orgId/applications', requireOrg, async (req, res) => {
  try {
    const orgId = parseInt(req.params.orgId);
    // ensure logged org matches requested orgId
    if (req.session.user.id !== orgId) return res.status(403).json({ message: 'Forbidden' });

    const applications = await prisma.application.findMany({
  where: {
    scholarship: {
      organisationId: orgId   
    }
  },
  include: {
    user: {
      include: { profiles: true }  
    },
    scholarship: true
  },
  orderBy: {
    appliedAt: "desc"
  }
});
    res.json(applications);
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

// ----------------- Convenience endpoints -----------------
// whoami
app.get('/api/whoami', (req, res) => {
  res.json({ session: req.session.user || null });
});

// start
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
