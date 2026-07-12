require('dotenv').config({ path: process.env.DOTENV_PATH || '.env.backend' });
const mongoose = require('mongoose');
const User = require('../src/models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/underground';
const ADMIN_UID = process.env.ADMIN_UID || process.argv[2];
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.argv[3] || 'purgatoriounder@gmail.com';
const ADMIN_DISPLAYNAME = process.env.ADMIN_DISPLAYNAME || process.argv[4] || 'Admin';

if (!ADMIN_UID) {
  console.error('Missing ADMIN_UID. Provide it as env var or as the first CLI argument.');
  console.error('Example: ADMIN_UID=abcd1234 node scripts/seedAdmin.js');
  console.error('Or: node scripts/seedAdmin.js abcd1234 admin@example.com "Admin Name"');
  process.exit(1);
}

async function main() {
  try {
    console.log('Connecting to MongoDB:', MONGO_URI);
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

    let user = await User.findOne({ uid: ADMIN_UID });
    if (user) {
      user.email = ADMIN_EMAIL;
      user.displayName = ADMIN_DISPLAYNAME;
      user.isAdmin = true;
      user.isOfficial = true;
      await user.save();
      console.log('Updated existing admin user:', { uid: user.uid, email: user.email });
    } else {
      user = new User({
        uid: ADMIN_UID,
        email: ADMIN_EMAIL,
        displayName: ADMIN_DISPLAYNAME,
        isAdmin: true,
        isOfficial: true,
      });
      await user.save();
      console.log('Created admin user:', { uid: user.uid, email: user.email });
    }

    await mongoose.disconnect();
    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding admin user:', err);
    process.exit(1);
  }
}

main();
