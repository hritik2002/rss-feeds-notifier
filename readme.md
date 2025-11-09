# RSS Subscriber

An intelligent RSS feed watcher that monitors your favorite RSS feeds, filters content based on your interests using AI, and sends you email notifications for relevant new posts.

## Features

- 🔍 **Smart Content Filtering**: Uses OpenAI GPT to analyze posts and only notifies you about content relevant to your interests
- 📧 **Email Notifications**: Beautiful HTML email notifications with post summaries
- ⏰ **Automated Monitoring**: Runs on a cron schedule (every 6 hours by default) to check for new posts
- 🗄️ **SQLite Database**: Tracks feed history to avoid duplicate notifications
- 🌐 **REST API**: Simple Express server with endpoints to view feeds and manually trigger checks
- 🔒 **SSL Support**: Handles feeds with self-signed or problematic SSL certificates

## Demo / Screenshots
This is how the email looks like (will improve the email template with time)
<img width="1050" height="781" alt="Screenshot 2025-11-09 at 6 12 33 PM" src="https://github.com/user-attachments/assets/e53d13ac-45b3-47ed-9280-c282aa3f9dcd" />


## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- An OpenAI API key (for content filtering)
- A Resend API key (get one for free at [resend.com](https://resend.com))

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/hritik2002/rss-feeds-notifier
   cd rss-feeds-notifier
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a `.env` file** in the root directory with the following variables:
   ```env
   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here

   # Resend API Configuration
   RESEND_API_KEY=re_your_resend_api_key
   RESEND_FROM_EMAIL=onboarding@resend.dev
   MAIL_TO=recipient@example.com

   # Server Configuration (optional)
   PORT=3000
   ```

   **Notes:**
   - **Resend API Key**: Get your API key from [resend.com](https://resend.com) (free tier available)
   - **From Email**: 
     - `RESEND_FROM_EMAIL` is optional - if not set, defaults to `onboarding@resend.dev`
     - You **cannot** use Gmail, Yahoo, or other personal email domains (they must be verified)
     - Use `onboarding@resend.dev` for testing, or verify your own domain at [resend.com/domains](https://resend.com/domains)
     - The application automatically detects unverified domains and uses `onboarding@resend.dev` as a fallback

## Configuration

### Customizing RSS Feeds

Edit `src/data/feeds.js` to add, remove, or modify RSS feed URLs:

```javascript
export const feeds = [
  { url: "https://blog.pragmaticengineer.com/rss/" },
  { url: "https://overreacted.io/rss.xml" },
  // Add your own feeds here
  { url: "https://example.com/feed" },
];
```

### Customizing Interests

Edit `src/data/interests.js` to define what content should be filtered and sent to you:

```javascript
export const interests = [
  "Software Engineering",
  "Database internals",
  "Web Development",
  // Add your own interests here
  "Machine Learning",
  "DevOps",
];
```

The AI will analyze each post and only send notifications if the content is relevant to these interests.

### Changing the Check Schedule

Edit `src/rssWatcher.js` to modify the cron schedule. The default is every 6 hours:

```javascript
// Current: Every 6 hours
cron.schedule("0 */6 * * *", watchRSSFeeds);

// Examples:
// Every hour: "0 * * * *"
// Every 12 hours: "0 */12 * * *"
// Daily at 9 AM: "0 9 * * *"
// Every 30 minutes: "*/30 * * * *"
```

[Cron syntax reference](https://crontab.guru/)

### Customizing Email Template

Edit `src/notifier.js` to modify the email HTML template. The `sendNewPostEmail` function contains the email structure and styling.

### Changing Database Location

Edit `src/db.js` to change the SQLite database file path:

```javascript
const db = await open({
  filename: './feeds.db', // Change this path
  driver: sqlite3.Database
});
```

### Adjusting SSL Certificate Handling

If you need stricter SSL verification, edit `src/rssWatcher.js`:

```javascript
const parser = new RssParser({
  requestOptions: {
    rejectUnauthorized: true, // Set to true for strict SSL verification
    timeout: 10000, // Adjust timeout as needed
  },
});
```

### Changing OpenAI Model

Edit `src/llmClient.js` to use a different OpenAI model:

```javascript
const response = await openai.chat.completions.create({
  model: "gpt-4o-mini", // Change to "gpt-4", "gpt-3.5-turbo", etc.
  // ...
});
```

## Usage

### Starting the Server

```bash
npm start
```

The server will:
- Start the Express server on port 3000 (or the port specified in `.env`)
- Run an initial RSS feed check
- Schedule automatic checks based on the cron schedule

### API Endpoints

- **GET `/`**: Returns all tracked feeds with their latest post information
  ```bash
  curl http://localhost:3000/
  ```

- **POST `/watch-rss-feeds`**: Manually trigger an RSS feed check
  ```bash
  curl -X POST http://localhost:3000/watch-rss-feeds
  ```

## How It Works

1. **Feed Monitoring**: The application periodically checks all configured RSS feeds
2. **Content Analysis**: For each new post, the content is sent to OpenAI to:
   - Determine if it's relevant to your interests
   - Generate a summary (if relevant)
3. **Notification**: If the post is relevant, a beautifully formatted email is sent with:
   - Feed title
   - Post title
   - AI-generated summary
   - Direct link to the post
4. **Database Tracking**: The application tracks the last seen post for each feed to avoid duplicate notifications

## Project Structure

```
rss-subsriber/
├── src/
│   ├── data/
│   │   ├── feeds.js          # RSS feed URLs
│   │   └── interests.js      # Your interests for filtering
│   ├── db.js                 # SQLite database initialization
│   ├── index.js              # Express server entry point
│   ├── llmClient.js          # OpenAI integration for content analysis
│   ├── notifier.js           # Email notification service
│   └── rssWatcher.js         # RSS feed monitoring and processing
├── feeds.db                  # SQLite database (auto-generated)
├── .env                      # Environment variables (create this)
├── package.json
└── readme.md
```

## Troubleshooting

### Email Not Sending

1. **Verify Resend API Key**:
   - Ensure `RESEND_API_KEY` is set correctly in your `.env` file
   - Get your API key from [resend.com](https://resend.com) dashboard
   - Check that the API key starts with `re_`

2. **Domain Verification Issues**:
   - If you see "domain is not verified" errors:
     - Use `onboarding@resend.dev` for testing (this is the default)
     - You **cannot** use Gmail, Yahoo, Hotmail, or Outlook addresses
     - To use your own email, verify your domain at [resend.com/domains](https://resend.com/domains)
   - The application automatically falls back to `onboarding@resend.dev` if an unverified domain is detected

3. **Check Environment Variables**:
   - Verify `MAIL_TO` is set correctly (recipient email address)
   - `RESEND_FROM_EMAIL` is optional - defaults to `onboarding@resend.dev`
   - Ensure all required variables are set in your `.env` file

4. **Review Console Logs**:
   - Check for specific error messages from Resend API
   - Common errors:
     - Invalid API key: Verify your `RESEND_API_KEY`
     - Domain not verified: Use `onboarding@resend.dev` or verify your domain
     - Rate limit exceeded: Check your Resend account limits

5. **For Railway/Cloud Deployments**:
   - Resend API uses HTTP/HTTPS (port 443), which works reliably in cloud environments
   - No SMTP port blocking issues
   - Check Railway logs for any network-related errors
   - Verify your environment variables are set in Railway's dashboard

### OpenAI API Errors

1. Verify your `OPENAI_API_KEY` is correct in `.env`
2. Check your OpenAI account has sufficient credits
3. Review API rate limits if you're checking many feeds frequently

### No Notifications Received

1. Check that posts are actually relevant to your interests (the AI filters them)
2. Verify the database is tracking feeds correctly: `GET http://localhost:3000/`
3. Manually trigger a check: `POST http://localhost:3000/watch-rss-feeds`
4. Check console logs for any errors during feed processing

### Database Issues

If you need to reset the database:
1. Stop the application
2. Delete `feeds.db`
3. Restart the application (it will create a new database)

## License

ISC

## Author

hritik2002

