# 📋 Step-by-Step Implementation Guide

## Version: v1.0.0

**Repository:** https://github.com/NaveenMandadi444/Smart-Mern-Form  
**Tag:** v1.0.0  
**Release Date:** February 7, 2026

---

## 🎯 Project Overview

Smart MERN Form is an intelligent document processing application that:

- Extracts data from documents using OCR and AI
- Stores extracted data in a secure vault
- Provides smart form autofill capabilities
- Manages data with full CRUD operations

---

## 📦 Step 1: Clone the Repository

```bash
# Clone from GitHub
git clone https://github.com/NaveenMandadi444/Smart-Mern-Form.git
cd Smart-Mern-Form

# Checkout v1.0.0 tag
git checkout v1.0.0
```

---

## 🔧 Step 2: Install Dependencies

### Backend Setup

```bash
cd backend
npm install
```

**Packages Installed:**

- express - Web framework
- mongoose - MongoDB ORM
- dotenv - Environment variables
- cors - Cross-origin resource sharing
- helmet - Security headers
- jsonwebtoken - JWT authentication
- bcryptjs - Password hashing
- multer - File upload handling
- tesseract.js - OCR processing
- @google/generative-ai - Gemini AI integration

### Frontend Setup

```bash
cd ../frontend
npm install
```

**Packages Installed:**

- react, react-dom - UI framework
- react-router-dom - Routing
- axios - HTTP client
- tailwindcss - Styling
- sonner - Toast notifications
- lucide-react - Icons
- vite - Build tool

---

## 🔑 Step 3: Setup Environment Variables

### Backend Environment

```bash
cd backend
cp .env.example .env
```

**Edit `backend/.env`:**

```bash
# MongoDB (Local or Cloud)
MONGODB_URI=mongodb://localhost:27017/vision-form-mern
# OR Atlas: mongodb+srv://<user>:<pass>@cluster.mongodb.net/dbname

# JWT Secret (Generate new one)
JWT_SECRET=<run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">

# Google Gemini API Key
GEMINI_API_KEY=<get from https://makersuite.google.com/app/apikey>

# Google Vision (Choose ONE method):
# Method 1: API Key
GOOGLE_VISION_API_KEY=<your-key>

# Method 2: Service Account (Recommended)
GOOGLE_VISION_KEY_FILE=./credentials.json

# Server Settings
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Google Service Account (If using credentials.json)

```bash
cd backend
cp credentials.json.example credentials.json
```

**Steps to get credentials:**

1. Go to https://console.cloud.google.com
2. Create/Select Project
3. Enable Vision API
4. IAM & Admin → Service Accounts → Create Service Account
5. Grant "Cloud Vision API User" role
6. Create JSON key → Download
7. Replace content in `backend/credentials.json`

---

## 🗄️ Step 4: Setup MongoDB

### Option A: Local MongoDB

```bash
# Install MongoDB Community Edition
# Windows: https://www.mongodb.com/try/download/community
# Mac: brew install mongodb-community
# Linux: sudo apt install mongodb

# Start MongoDB
# Windows: Run as service (automatic)
# Mac: brew services start mongodb-community
# Linux: sudo systemctl start mongod

# Verify connection
mongosh
# Should connect to mongodb://localhost:27017
```

### Option B: MongoDB Atlas (Cloud)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Create database user
4. Whitelist IP (0.0.0.0/0 for development)
5. Get connection string
6. Update MONGODB_URI in `.env`

---

## 🧪 Step 5: Test Backend Setup

```bash
cd backend

# Test API key loading
node test-api-key.js
# Should show: ✅ GEMINI_API_KEY is loaded

# Test database connection
node -e "require('./config/database.js').default()"
# Should show: MongoDB connected successfully

# Start backend server
npm run dev
# OR
node server.js
```

**Expected Output:**

```
🔍 DEBUG - GEMINI_API_KEY from process.env: LOADED ✅
✓ Server running on http://localhost:5000
✓ Environment: development
MongoDB connected successfully
```

**Test endpoints:**

```bash
# Health check
curl http://localhost:5000/health
# Response: {"status":"Server is running"}
```

---

## 🎨 Step 6: Start Frontend Development Server

```bash
cd frontend
npm run dev
```

**Expected Output:**

```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Open browser:** http://localhost:5173

---

## 📝 Step 7: Register First User

1. Open http://localhost:5173
2. Navigate to `/auth` page
3. Click "Register" tab
4. Fill form:
   - Name: Your Name
   - Email: your@email.com
   - Password: (minimum 6 characters)
5. Click "Register"

**Behind the scenes:**

- Password is hashed with bcrypt
- User saved to MongoDB `users` collection
- JWT token generated and stored in localStorage

---

## 📄 Step 8: Upload First Document

### Supported Documents:

- ✅ Aadhaar Card
- ✅ PAN Card
- ✅ Passport
- ✅ 10th Marksheet
- ✅ 12th/Inter Marksheet
- ✅ Degree Certificate

### Upload Process:

1. **Go to Dashboard** (http://localhost:5173/)
2. **Click "Upload Document"**
3. **Select document type** from dropdown
4. **Choose file** (PNG, JPG, PDF)
5. **Click Upload**

**Processing Steps:**

```
Upload → Multer saves to backend/uploads/
       → Tesseract OCR extracts text
       → Gemini AI structures data
       → Data saved to VaultSection & VaultField
       → Returns extracted fields
```

**Example Response:**

```json
{
  "documentId": "507f1f77bcf86cd799439011",
  "extractedData": {
    "documentType": "AADHAAR",
    "fields": [
      { "name": "Full Name", "value": "John Doe", "confidence": 95 },
      { "name": "Aadhaar Number", "value": "1234 5678 9012", "confidence": 98 }
    ]
  }
}
```

---

## 🗂️ Step 9: Manage Data Vault

Navigate to http://localhost:5173/vault

### View Sections

- Click section header to expand/collapse
- View all fields with their values
- See extraction source (AADHAAR, MANUAL, etc.)

### Add Field Manually

1. Expand any section
2. Click **"Add Field Manually"** button
3. Enter field name: `"Mobile Number"`
4. Enter field value: `"+91 9876543210"`
5. Click **"Add Field"**
6. ✅ Field added and saved to MongoDB

### Edit Field

1. Click **edit icon** (pencil) on any field
2. Modify field name or value
3. Click **"Save Changes"**
4. ✅ Field updated in database
5. 🎉 Toast notification: "Field updated successfully"

### Delete Field

1. Click **delete icon** (trash) on any field
2. Confirmation dialog appears
3. Click **"Delete"**
4. ✅ Field removed from database
5. 🎉 Toast: "Field deleted successfully"

### Delete Entire Section

1. Click **delete icon** in section header
2. Warning dialog: "This will delete all fields..."
3. Click **"Delete Section"**
4. ✅ Section + all fields deleted
5. 🎉 Toast: "Section deleted successfully"

---

## 🤖 Step 10: Use Form Autofill

Navigate to http://localhost:5173/form-assist

### Smart Autofill:

1. **Enter form field name** (e.g., "Full Name", "Date of Birth")
2. **Provide context** (optional): "Government form"
3. Click **"Get Suggestions"**
4. **AI suggests best match** from your vault
5. Click **"Copy"** to use the value

### Get Alternatives:

- Shows all possible matches from vault
- Filter by section or field type
- One-click copy with format options

---

## 🔍 Step 11: Understand the Database Structure

### MongoDB Collections:

#### 1. **users**

```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. **vaultsections**

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  sectionType: String, // PERSONAL_MASTER, AADHAAR_SECTION, etc.
  authority: Number,   // 100=highest, 70=education
  sourceDocument: String,
  confidence: Number,
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. **vaultfields**

```javascript
{
  _id: ObjectId,
  sectionId: ObjectId (ref: VaultSection),
  userId: ObjectId (ref: User),
  fieldName: String,
  fieldValue: String,
  confidence: Number (0-100),
  extractedFrom: String, // AADHAAR, PAN, MANUAL, etc.
  metadata: {
    isFamilyData: Boolean,
    documentId: ObjectId,
    rawExtractedText: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### 4. **vaultdocuments**

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  documentType: String,
  filePath: String,
  fileSize: Number,
  mimeType: String,
  status: String, // UPLOADED, PROCESSING, COMPLETED, FAILED
  ocrText: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### 5. **vaultambiguities**

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  documentId: ObjectId,
  fieldName: String,
  possibleValues: [String],
  status: String, // PENDING, RESOLVED, IGNORED
  resolvedValue: String,
  createdAt: Date
}
```

---

## 🛠️ Step 12: Development Workflow

### Daily Development:

```bash
# Terminal 1 - Backend
cd backend
npm run dev
# Or: nodemon server.js

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - MongoDB (if local)
mongosh
```

### Make Changes:

**Backend Changes:**

- Edit controllers, models, routes
- Server auto-restarts (if using nodemon)
- Test with Postman or curl

**Frontend Changes:**

- Edit React components
- Vite hot-reloads automatically
- See changes in browser instantly

### Git Workflow:

```bash
# Check status
git status

# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: Add new feature"

# Push to GitHub
git push origin feature/new-feature

# Create Pull Request on GitHub
```

---

## 🧪 Step 13: Testing

### Manual Testing Checklist:

#### Authentication:

- [ ] Register new user
- [ ] Login with correct credentials
- [ ] Login with wrong password (should fail)
- [ ] Access protected routes without token (should redirect)

#### Document Upload:

- [ ] Upload Aadhaar document
- [ ] Upload PAN document
- [ ] Upload passport
- [ ] Upload education certificates
- [ ] Try invalid file format (should show error)

#### Data Vault:

- [ ] View all sections
- [ ] Expand/collapse sections
- [ ] Add field manually
- [ ] Edit field name and value
- [ ] Delete single field with confirmation
- [ ] Delete entire section with confirmation
- [ ] Verify database updated (check MongoDB)

#### Form Autofill:

- [ ] Request autofill for "Name"
- [ ] Request autofill for "Date of Birth"
- [ ] Get alternatives for ambiguous fields
- [ ] Copy formatted values

#### Error Handling:

- [ ] Network error (stop backend, try action)
- [ ] Invalid data (empty form submission)
- [ ] Unauthorized access (manually delete token)

---

## 📊 Step 14: Monitor and Debug

### Backend Logs:

```bash
# In backend terminal, watch for:
✓ Server running on http://localhost:5000
MongoDB connected successfully
POST /api/documents/upload 200 2.345s
GET /api/vault/sections 200 0.089s
```

### Frontend Console:

```javascript
// Open browser DevTools (F12)
// Check Console tab for errors
// Check Network tab for API calls
```

### MongoDB Queries:

```bash
mongosh
use vision-form-mern

# View all users
db.users.find().pretty()

# View vault sections
db.vaultsections.find().pretty()

# View fields for specific user
db.vaultfields.find({ userId: ObjectId("your-user-id") })

# Count documents
db.vaultdocuments.countDocuments()
```

---

## 🚀 Step 15: Deploy (Optional)

### Backend Deployment (e.g., Render, Railway):

1. Push code to GitHub ✅ (Already done!)
2. Create account on Render/Railway
3. Connect GitHub repository
4. Set environment variables (same as .env)
5. Deploy!

### Frontend Deployment (e.g., Vercel, Netlify):

```bash
cd frontend

# Build production version
npm run build

# Deploy to Vercel
npx vercel

# Or deploy to Netlify
netlify deploy --prod
```

### Update Environment Variables:

**Backend .env:**

```bash
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
MONGODB_URI=<Atlas connection string>
```

**Frontend .env:**

```bash
VITE_API_URL=https://your-backend.render.com
```

---

## 📚 Step 16: Project Documentation Reference

### Key Files:

| File                          | Purpose                          |
| ----------------------------- | -------------------------------- |
| `SETUP_SECRETS.md`            | Environment setup guide          |
| `VAULT_ENHANCEMENT_GUIDE.md`  | Vault CRUD feature documentation |
| `SECURITY_ACTION_REQUIRED.md` | Security best practices          |
| `README.md`                   | Project overview                 |
| `QUICKSTART.md`               | Quick start guide                |
| `backend/server.js`           | Main backend entry point         |
| `frontend/src/App.tsx`        | Main frontend component          |

### API Documentation:

**Auth Routes:**

- POST `/api/auth/register` - Register user
- POST `/api/auth/login` - Login user

**Document Routes:**

- POST `/api/documents/upload` - Upload document
- POST `/api/documents/process` - Process uploaded document
- GET `/api/documents` - Get all documents
- GET `/api/documents/:id` - Get specific document

**Vault Routes:**

- GET `/api/vault/sections` - Get all vault sections
- GET `/api/vault/section/:sectionType` - Get section by type
- GET `/api/vault/fields/:sectionId` - Get fields in section
- POST `/api/vault/fields` - Add field manually
- PUT `/api/vault/fields/:fieldId` - Update field
- DELETE `/api/vault/fields/:fieldId` - Delete field
- DELETE `/api/vault/section/:sectionId` - Delete section

**Autofill Routes:**

- POST `/api/autofill/suggest` - Get autofill suggestions
- POST `/api/autofill/alternatives` - Get alternative values
- GET `/api/autofill/learned-fields` - Get learned fields
- POST `/api/autofill/format` - Format field value

**Ambiguity Routes:**

- GET `/api/ambiguities` - Get ambiguous fields
- PUT `/api/ambiguities/:id/resolve` - Resolve ambiguity
- DELETE `/api/ambiguities/:id` - Delete ambiguity

---

## 🎓 Step 17: Learn and Extend

### Next Features to Build:

1. **Enhanced OCR:**
   - Support for scanned PDFs
   - Multi-page document processing
   - Better accuracy with preprocessing

2. **Advanced AI:**
   - Document classification
   - Relationship detection between fields
   - Smart validation rules

3. **User Features:**
   - Profile management
   - Document sharing
   - Export to PDF/CSV
   - Bulk operations

4. **Security:**
   - Two-factor authentication
   - Field-level encryption
   - Audit logs
   - Role-based access

5. **UI/UX:**
   - Dark mode
   - Mobile app (React Native)
   - Drag-drop document upload
   - Real-time collaboration

---

## ✅ Completion Checklist

- [x] Repository cloned from GitHub
- [x] Dependencies installed (backend + frontend)
- [x] Environment variables configured
- [x] MongoDB connected
- [x] Backend server running on :5000
- [x] Frontend server running on :5173
- [x] User registered and logged in
- [x] Document uploaded and processed
- [x] Data viewed in vault
- [x] Manual field added
- [x] Field edited successfully
- [x] Field deleted successfully
- [x] Section deleted successfully
- [x] Form autofill tested
- [x] All features working as expected!

---

## 🆘 Troubleshooting

### Common Issues:

**"Cannot connect to MongoDB"**

```bash
# Check MongoDB is running
mongosh
# If fails, start MongoDB service
```

**"API key not loaded"**

```bash
# Verify .env file exists
ls backend/.env
# Check GEMINI_API_KEY is set
cat backend/.env | grep GEMINI
```

**"Module not found"**

```bash
# Reinstall dependencies
cd backend && npm install
cd frontend && npm install
```

**"Port already in use"**

```bash
# Windows: Find and kill process
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:5000 | xargs kill -9
```

**"CORS error in browser"**

- Check FRONTEND_URL in backend/.env
- Verify it matches your frontend URL
- Restart backend server after changing .env

---

## 📞 Support

**Repository:** https://github.com/NaveenMandadi444/Smart-Mern-Form  
**Issues:** https://github.com/NaveenMandadi444/Smart-Mern-Form/issues  
**Tag:** v1.0.0

---

## 🎉 Congratulations!

You've successfully set up and tested the Smart MERN Form application!

**What you've accomplished:**

- ✅ Full-stack MERN application running
- ✅ AI-powered document processing
- ✅ Secure data vault with CRUD operations
- ✅ Intelligent form autofill system
- ✅ Production-ready authentication
- ✅ Clean and secure repository

**Happy Coding! 🚀**
