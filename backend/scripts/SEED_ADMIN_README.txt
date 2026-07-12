chore: add seed script to create/update an admin user in MongoDB

This script reads MONGO_URI and admin details from .env.backend (or environment variables) and ensures a User document with the
provided UID or email exists and has isAdmin/isOfficial set to true.

New behavior
- You can now pass ADMIN_EMAIL instead of (or together with) ADMIN_UID.
- The script will first try to find a user by email (if provided) and update it to admin.
- If not found by email, but ADMIN_UID is provided, it will look up by UID and update.
- If no existing user is found and both ADMIN_UID and ADMIN_EMAIL are provided, the script will create a new User with those values.
- If only ADMIN_EMAIL is provided and the user does not exist, the script will fail and ask for ADMIN_UID so the new record has a uid value.

Usage (from repository root):
  # 1) Ensure backend/.env or .env.backend contains MONGO_URI (when running with Docker, the compose file sets it)
  # 2) Run the script in the backend folder:
  cd backend

Examples:
  # Provide UID via env var (no email):
  ADMIN_UID=<firebase-uid> node scripts/seedAdmin.js

  # Provide UID as first arg and email/displayName as later args:
  node scripts/seedAdmin.js <firebase-uid> admin@example.com "Admin Name"

  # Provide only email (will update existing user by email if present):
  node scripts/seedAdmin.js "" admin@example.com "Admin Name"

  # Provide both: will create or update accordingly:
  node scripts/seedAdmin.js <firebase-uid> admin@example.com "Admin Name"

Notes:
- The script does not require the Firebase service account key because it operates directly on the MongoDB users collection.
- Prefer using the actual Firebase UID when creating a new user so the backend's User.uid matches the Firebase account uid.
- Do not commit real secrets (.env, serviceAccountKey.json) to the repository.
