chore: add seed script to create/update an admin user in MongoDB

This script reads MONGO_URI and admin details from .env.backend (or environment variables) and ensures a User document with the
provided UID exists and has isAdmin/isOfficial set to true.

Usage (from repository root):
  # 1) Ensure backend/.env or .env.backend contains MONGO_URI (when running with Docker, the compose file sets it)
  # 2) Run the script in the backend folder:
  cd backend
  # supply UID via env var:
  ADMIN_UID=<firebase-uid> node scripts/seedAdmin.js
  # Or pass UID as first arg + optional email + displayName:
  node scripts/seedAdmin.js <firebase-uid> admin@example.com "Admin Name"
