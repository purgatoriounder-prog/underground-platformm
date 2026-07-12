require('dotenv').config({ path: process.env.DOTENV_PATH || '.env.backend' });
const mongoose = require('mongoose');
const User = require('../src/models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/underground';
const ADMIN_UID = process.env.ADMIN_UID || process.argv[2];
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.argv[3];
const ADMIN_DISPLAYNAME = process.env.ADMIN_DISPLAYNAME || process.argv[4] || 'Admin';

if (!ADMIN_UID && !ADMIN_EMAIL) {
  console.error('Missing ADMIN_UID or ADMIN_EMAIL. Provide at least one as env var or CLI argument.');
  console.error('Examples:');
  console.error('  ADMIN_UID=abcd1234 node scripts/seedAdmin.js');
  console.error('  node scripts/seedAdmin.js abcd1234 admin@example.com "Admin Name"');
  console.error('  node scripts/seedAdmin.js "" admin@example.com "Admin Name"');
  process.exit(1);
}

async function main() {
  try {
    console.log('Connecting to MongoDB:', MONGO_URI);
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

    let user = null;

    if (ADMIN_EMAIL) {
      // Try to find by email first
      user = await User.findOne({ email: ADMIN_EMAIL });
      if (user) {
        console.log('Found existing user by email:', ADMIN_EMAIL);
        // If an ADMIN_UID was provided and the user doesn't have a uid, set it
        if (ADMIN_UID && (!user.uid || user.uid !== ADMIN_UID)) {
          user.uid = ADMIN_UID;
        }
        user.displayName = ADMIN_DISPLAYNAME || user.displayName;
        user.isAdmin = true;
        user.isOfficial = true;
        await user.save();
        console.log('Updated user (by email) to admin:', { uid: user.uid, email: user.email });
        await mongoose.disconnect();
        console.log('Done.');
        process.exit(0);
      }
    }

    if (ADMIN_UID) {
      // If not found by email (or email was not provided), try by uid
      user = await User.findOne({ uid: ADMIN_UID });
      if (user) {
        console.log('Found existing user by uid:', ADMIN_UID);
        if (ADMIN_EMAIL && (!user.email || user.email !== ADMIN_EMAIL)) {
          user.email = ADMIN_EMAIL;
        }
        user.displayName = ADMIN_DISPLAYNAME || user.displayName;
        user.isAdmin = true;
        user.isOfficial = true;
        await user.save();
        console.log('Updated user (by uid) to admin:', { uid: user.uid, email: user.email });
        await mongoose.disconnect();
        console.log('Done.');
        process.exit(0);
      }

      // Not found by uid -> if we have an email we can create, otherwise we require email to create
      if (!ADMIN_EMAIL) {
        console.error('No user found with the provided UID and no ADMIN_EMAIL provided to create a new user.');
        console.error('Either provide ADMIN_EMAIL (to look up by email or create) or ensure the UID exists in Firebase and in the users collection.');
        await mongoose.disconnect();
        process.exit(1);
      }

      // Create new user with provided uid and email
      const newUser = new User({
        uid: ADMIN_UID,
        email: ADMIN_EMAIL,
        displayName: ADMIN_DISPLAYNAME,
        isAdmin: true,
        isOfficial: true,
      });
      await newUser.save();
      console.log('Created new admin user:', { uid: newUser.uid, email: newUser.email });
      await mongoose.disconnect();
      console.log('Done.');
      process.exit(0);
    }

    // If we reach here, we had an email but no user and no uid to create
    console.error('No user found for the provided email and no ADMIN_UID provided to create a new user.');
    console.error('Please provide ADMIN_UID as an environment variable or CLI arg when creating a new user by email.');
    await mongoose.disconnect();
    process.exit(1);
  } catch (err) {
    console.error('Error seeding admin user:', err);
    try { await mongoose.disconnect(); } catch (e) {}
    process.exit(1);
  }
}

main();
