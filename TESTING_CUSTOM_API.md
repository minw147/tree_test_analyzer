# Testing Custom API Storage Functionality

This guide explains how to test the publish functionality with Custom API storage.

## Prerequisites

- Node.js installed
- A study created in the Creator with tree structure and tasks

## Step 1: Start the Test Server

We've created a simple test server (`test-server.js`) that simulates a Custom API backend.

1. Open a terminal in the project root
2. Run the test server:
   ```bash
   node test-server.js
   ```

The server will start on `http://localhost:3001` and display available endpoints.

## Step 2: Configure Storage in Creator

1. Open the app in your browser
2. Navigate to the **Creator** page
3. Go to the **Storage** tab
4. Select **Custom API** option
5. Enter the API endpoint URL: `http://localhost:3001`
6. Select authentication method:
   - **None** (for testing with the simple server)
   - Or **API Key** / **Bearer Token** if your real API requires it
7. Click **Test Connection** - you should see a success message

## Step 3: Test Publishing a Study

1. Make sure your study has:
   - At least one node in the tree structure
   - At least one task
2. Go to the **Launch Study** tab
3. Click **Publish Study**
4. You should see:
   - Loading spinner on the button ("Publishing...")
   - Button becomes disabled during save
   - Status changes to "Published" when successful
   - Shareable link appears

## Step 4: Verify the API Call

Check the test server terminal - you should see:
```
PUT /studies/study-xxxxx
```

The study config should be saved in the server's memory.

## Step 5: Test Status Updates

1. With a published study, click **Close Study**
2. Check the server terminal - you should see:
   ```
   PUT /studies/study-xxxxx/status
   ```
3. Click **Reopen Study** - another status update call should appear

## Step 6: Test Unpublishing

1. Click **Unpublish**
2. The study config should be updated in the API
3. Status should change back to "Draft"

## Testing with a Real Custom API

If you have your own API endpoint:

1. Make sure your API implements these endpoints:
   - `POST /studies` - Create study
   - `PUT /studies/:id` - Update study
   - `GET /studies/:id` - Fetch study config
   - `GET /studies/:id/status` - Check status
   - `PUT /studies/:id/status` - Update status
   - `POST /studies/:id/results` - Submit results (for Phase 4)

2. Configure the endpoint URL in the Storage tab
3. Set up authentication if required
4. Test the connection
5. Publish your study

## Expected API Request Format

When publishing, the app sends a PUT request to `/studies/:id` with the full StudyConfig JSON:

```json
{
  "id": "study-xxxxx",
  "name": "My Study",
  "creator": "John Doe",
  "tree": [...],
  "tasks": [...],
  "storage": {...},
  "settings": {...},
  "status": "published",
  "accessStatus": "active",
  "publishedAt": "2025-01-26T...",
  "createdAt": "...",
  "updatedAt": "..."
}
```

## Troubleshooting

### Connection Test Fails
- Make sure the test server is running
- Check the URL is correct (no trailing slash)
- Check browser console for CORS errors (the test server handles CORS)

### Publish Fails
- Check browser console for error messages
- Verify the study has tree structure and tasks
- Check server terminal for error logs
- Make sure the endpoint URL is configured

### Status Updates Don't Work
- Check that the study is published first
- Verify the API endpoint supports PUT `/studies/:id/status`
- Check server logs for errors

## Next Steps

Once publish works, you can:
1. Build Participant View (Phase 4) to test the full flow
2. Test participant result submission
3. Test fetching study config from API in participant view

