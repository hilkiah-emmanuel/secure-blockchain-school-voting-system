# Login Credentials for Testing

## 🚀 Application URLs

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3001
- **WebSocket**: ws://localhost:3001/ws

## 🔐 Default Login Credentials

### Admin Account
```
Email: admin@school.co.tz
Password: admin123
```

This account has full admin access to:
- Create and manage elections
- Create and manage classes
- Import students via CSV
- View all results
- Export data
- **Manage Teachers** ✨ NEW
- **Manage Candidates** ✨ NEW

### Teacher Account
```
Email: teacher@school.co.tz
Password: teacher123
```

This account has teacher access to:
- View assigned classes
- Manage students in classes
- Open/close voting
- View results for their classes

### Creating Additional Teacher Accounts

You can register new teacher accounts by:
1. Using the registration endpoint (if enabled)
2. Or manually adding to the database

**Note**: The system currently uses a simple authentication. For production, you should:
- Change the default admin password
- Set up proper user management
- Enable 2FA for additional security

## 📝 Testing Workflow

### 1. Login as Admin or Teacher
- Go to http://localhost:8080
- **Admin**: Enter `admin@school.co.tz` / `admin123`
- **Teacher**: Enter `teacher@school.co.tz` / `teacher123`
- You'll be redirected based on your role (Admin Panel or Teacher Dashboard)

### 2. Add a Teacher (Admin Only)
- Navigate to **Admin > Teachers**
- Click **New Teacher**
- Enter name, email, and password
- Click **Create Teacher**
- Teacher can now login with these credentials

### 3. Create a Class
- Navigate to **Admin > Classes**
- Click **New Class**
- Enter class name and grade
- Click **Create Class**

### 4. Add Students
- Expand the class you created
- Either:
  - **Import CSV**: Click "Import CSV" and upload a file with student names
  - **Add Manually**: Type a student name and click the + button

### 5. Add Candidates (Admin Only)
- Navigate to **Admin > Candidates**
- Click **New Candidate**
- Select position from dropdown
- Enter candidate name
- Optionally add photo URL
- Click **Add Candidate**

### 6. Create an Election
- Navigate to **Admin > Elections**
- Click **New Election**
- Fill in election details
- Add positions (e.g., "Class President")
- Add candidates for each position

### 7. Open Voting
- Go to **Admin > Classes**
- Find your class
- Click the toggle to open voting

### 8. Vote as Student
- Go to **Dashboard** (or direct URL: `/class/{classId}`)
- Select a student name
- Cast votes for each position
- Submit vote

### 9. View Results
- Click **Results** button on the class page
- Or go to `/results/{classId}`
- Export as CSV or PDF

## 🎯 Quick Test Scenarios

### Scenario 1: Basic Voting
1. Login as admin
2. Create class "Test Class"
3. Add 3 students: "Alice", "Bob", "Charlie"
4. Create election with position "President"
5. Add 2 candidates: "Alice", "Bob"
6. Open voting
7. Logout and login as teacher (or use same account)
8. Go to class, select "Alice", vote for "Bob"
9. View results

### Scenario 2: Multi-Choice Voting
1. Create election with position type "multi"
2. Add multiple candidates
3. Students can select multiple candidates

### Scenario 3: Ranked Voting
1. Create election with position type "ranked"
2. Add candidates
3. Students rank candidates in order

## 🔧 Troubleshooting

### Can't Login?
- Make sure backend is running on port 3001
- Check browser console for errors
- Verify database was initialized (check `server/data/voting.db`)

### No Classes Showing?
- Create a class first in Admin > Classes
- Make sure you're logged in as admin

### Votes Not Recording?
- Check backend logs for errors
- Verify WebSocket connection
- Check blockchain/Ganache if using full blockchain mode

## 📞 Support

If you encounter issues:
1. Check server logs in the terminal
2. Check browser console for frontend errors
3. Verify both servers are running
4. Check database file exists: `server/data/voting.db`

