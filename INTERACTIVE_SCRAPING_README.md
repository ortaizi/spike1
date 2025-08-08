# Interactive Scraping Development Workflow

## 🎯 Overview

This interactive workflow allows you to test BGU Moodle scraping with real credentials and validate selectors step-by-step. The goal is to build reliable scraping selectors through real-time validation.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Interactive Test
```bash
npm run test-scrape
```

Or with environment variables:
```bash
BGU_USERNAME=your_username BGU_PASSWORD=your_password npm run test-scrape
```

## 🔧 How It Works

### Interactive Testing Phase
1. **Enter Credentials**: Provide your real BGU username and password
2. **Browser Opens**: A visible browser window opens for debugging
3. **Login Process**: The script attempts to log into Moodle
4. **Course Extraction**: Searches for and extracts your enrolled courses
5. **Data Validation**: Shows extracted data and asks for confirmation
6. **Selector Saving**: Saves working selectors after confirmation

### Step-by-Step Process
```
🔐 Starting BGU Moodle login test...
Enter BGU username: your_username
Enter BGU password: ********
🌐 Launching browser...
🌐 Navigating to BGU Moodle...
🔐 Attempting to log in...
✅ Login successful!
📚 Looking for enrolled courses...
📚 Found the following courses:
==================================================
1. מבוא למדעי המחשב
   ID: CS101
   Professor: ד"ר כהן
   Students: 150

2. מתמטיקה דיסקרטית
   ID: MATH201
   Professor: פרופ' לוי
   Students: 120
==================================================
Used selector: .coursebox
Are these your courses? (y/n): y
✅ Great! Saving selectors...
💾 Selector data:
{
  "courseSelector": ".coursebox",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "coursesFound": 2,
  "courses": [...]
}
Save to file? (y/n): y
💾 Saved to course-selectors.json
```

## 🛠️ Features

### Real-Time Validation
- **Visible Browser**: See exactly what the script is doing
- **Interactive Prompts**: Confirm each step before proceeding
- **Error Recovery**: Retry failed steps with different selectors
- **Debug Screenshots**: Automatic screenshots for troubleshooting

### Hebrew Support
- **Hebrew Text Processing**: Properly handles Hebrew course names
- **RTL Layout Support**: Works with Hebrew interface
- **Hebrew-Friendly Output**: Console output in Hebrew when needed

### Flexible Selector Testing
- **Multiple Selector Strategies**: Tries various CSS selectors
- **Manual Selector Input**: Enter custom selectors if needed
- **Selector Validation**: Only saves selectors after confirmation
- **Fallback Options**: Multiple approaches for finding elements

## 📁 Generated Files

### course-selectors.json
```json
{
  "courseSelector": ".coursebox",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "coursesFound": 2,
  "courses": [
    {
      "name": "מבוא למדעי המחשב",
      "id": "CS101",
      "professor": "ד\"ר כהן",
      "studentCount": "150"
    }
  ]
}
```

### debug-screenshot.png
- Screenshot taken at the end of each test run
- Useful for debugging when selectors fail
- Shows the current state of the page

## 🔧 Configuration

### Environment Variables
```bash
# Optional: Set credentials in environment
export BGU_USERNAME=your_username
export BGU_PASSWORD=your_password
```

### Browser Settings
```javascript
// In test-scraping.js
browser = await chromium.launch({ 
  headless: false, // Show browser for debugging
  slowMo: 1000    // Slow down actions for visibility
});
```

## 🚨 Troubleshooting

### Common Issues

#### Login Fails
```
❌ Login failed. Please check your credentials.
🔍 Current page URL: https://moodle2.bgu.ac.il/moodle/
🔍 Page title: Login - BGU Moodle
```
**Solution**: Verify your credentials and try again

#### No Courses Found
```
❌ No courses found with standard selectors
🔍 Available elements that might be courses:
- "מבוא למדעי המחשב" -> /course/view.php?id=123
```
**Solution**: Enter a custom selector based on the available elements

#### Hebrew Text Issues
```
⚠️  Error extracting course info: Invalid character
```
**Solution**: The script includes Hebrew text cleaning functions

### Debug Mode
The script runs in debug mode by default:
- **Visible Browser**: You can see what's happening
- **Slow Actions**: 1-second delays between actions
- **Screenshots**: Automatic screenshots for debugging
- **Detailed Logs**: Console output for every step

## 🔄 Development Workflow

### Phase 1: Login Testing
1. Run `npm run test-scrape`
2. Enter your credentials
3. Confirm login works
4. Save login selectors

### Phase 2: Course Extraction
1. Confirm courses are found correctly
2. Validate course information
3. Save course selectors

### Phase 3: Grade Extraction
1. Navigate to grades page
2. Extract grade information
3. Validate grade data
4. Save grade selectors

### Phase 4: Assignment Extraction
1. Navigate to assignments
2. Extract assignment data
3. Validate assignment information
4. Save assignment selectors

## 📊 Success Criteria

### Interactive Testing is Successful When:
- ✅ Login works with real credentials
- ✅ Courses are extracted correctly
- ✅ Hebrew text displays properly
- ✅ All data is validated by developer
- ✅ Selectors are saved after confirmation
- ✅ Error handling works gracefully

### Ready for Production When:
- ✅ All selectors are validated with real data
- ✅ Error handling covers edge cases
- ✅ Performance is acceptable
- ✅ Hebrew text processing works correctly
- ✅ Database integration is confirmed

## 🔒 Security Notes

### Credential Handling
- **Environment Variables**: Preferred method for credentials
- **No Hardcoding**: Never hardcode credentials in code
- **Temporary Storage**: Credentials are not saved permanently
- **Secure Input**: Password input is masked in console

### Data Privacy
- **Local Testing**: All testing is done locally
- **No External Storage**: Data is not sent to external services
- **Debug Files**: Screenshots and logs are stored locally only
- **Cleanup**: Debug files can be deleted after testing

## 🎯 Next Steps

After successful interactive testing:

1. **Integrate with Main Scraping System**: Use validated selectors in the main scraper
2. **Add More Features**: Test grades, assignments, announcements
3. **Optimize Performance**: Reduce delays for production use
4. **Add Error Handling**: Implement robust error recovery
5. **Database Integration**: Save extracted data to Supabase

## 📞 Support

If you encounter issues:

1. **Check Console Output**: Look for error messages
2. **Review Screenshots**: Check debug-screenshot.png
3. **Try Different Selectors**: Enter custom selectors if needed
4. **Verify Credentials**: Ensure username/password are correct
5. **Check Network**: Ensure you can access Moodle normally

---

**Remember**: This is an interactive development tool. Always validate extracted data before using selectors in production. 