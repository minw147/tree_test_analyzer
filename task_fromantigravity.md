# Tree Test Suite Implementation

## Phase 1: Study Creator Foundation

* \[x] Create tree structure data types and interfaces
* \[x] Build Tree Editor component

  * \[x] Add/edit/delete nodes
  * \[x] Set node links/destinations
  * \[x] Update styling to match analyzer design
  * \[x] Always show current tree structure in text editor for easy editing

* \[x] Build Task Editor component

  * \[x] Add/edit/delete tasks
  * \[x] Task descriptions and instructions
  * \[x] Multiple expected paths per task with tree navigation
  * \[x] Bulk add tasks functionality
  * \[x] Task reordering (move up/down)

* \[x] Build Tree Preview component (reuse from usabilitree)

  * \[x] Interactive tree navigation with click-through selection
  * \[x] "I'd find it here" button on last clicked node
  * \[x] Breadcrumb trail
  * \[x] Preview in new tab with full participant flow

* \[x] Build Settings Editor component

  * \[x] Welcome message editor
  * \[x] Instructions editor
  * \[x] Completion message editor
  * \[x] Markdown formatting support

* \[x] Study configuration state management

  * \[x] Local storage persistence for study data (fallback)
  * \[x] Auto-save on changes (local storage for now, will add backend auto-save in Phase 2)
  * \[ ] Auto-save to backend API for hosted backend users (Phase 2)
  * \[x] Editable study name and creator name
  * \[x] Single study limitation (one study at a time in Creator mode)
  * \[x] Local storage warning tooltip
  * \[x] Status badge in Creator header (shows Draft/Published/Closed status)

## Phase 2: Storage Configuration

**Architecture:** Hosted backend (primary, paid) + Custom API (optional, free/BYOS)

* \[x] Define storage adapter interface
  * \[x] submit(result: ParticipantResult) - Must accept data in analyzer-compatible format (see Phase 5)
  * \[x] saveConfig(config: StudyConfig) - Save or update study configuration
  * \[x] checkStatus(studyId: string)
  * \[x] updateStatus(studyId: string, status: 'active' | 'closed')
  * \[x] fetchConfig(studyId: string)
  * \[x] testConnection()
  * \[x] Note: All adapters must ensure submitted data matches analyzer format requirements (Participant ID, Status, timestamps, task paths, outcomes, confidence, times)

* \[ ] Build hosted backend service (primary storage - paid feature)
  * \[ ] Backend API architecture:
    * \[ ] REST API (Node.js/Express or Python/FastAPI)
    * \[ ] PostgreSQL database (or MongoDB)
    * \[ ] Authentication system (JWT tokens for study creators)
    * \[ ] Study configuration storage
    * \[ ] Participant results storage
    * \[ ] Study status management
  * \[ ] API endpoints:
    * \[ ] POST /api/auth/register - User registration
    * \[ ] POST /api/auth/login - User login
  * \[ ] GET /api/studies - List all studies for current user (with filters)
  * \[ ] POST /api/studies - Create study (as draft)
  * \[ ] GET /api/studies/:id - Get study config
  * \[ ] PUT /api/studies/:id - Update study (supports draft updates)
  * \[ ] DELETE /api/studies/:id - Delete study
    * \[ ] POST /api/studies/:id/results - Submit participant results
    * \[ ] GET /api/studies/:id/status - Check study status
    * \[ ] PUT /api/studies/:id/status - Update study status
  * \[ ] Database schema:
    * \[ ] Users table (id, email, password_hash, created_at)
    * \[ ] Studies table (id, user_id, name, config_json, status, draft, created_at, updated_at)
      * \[ ] status: 'active' | 'closed'
      * \[ ] draft: boolean (true for draft studies)
    * \[ ] Results table (id, study_id, participant_id, results_json, submitted_at)
  * \[ ] Security:
    * \[ ] Password hashing (bcrypt)
    * \[ ] JWT token authentication
    * \[ ] Rate limiting
    * \[ ] Input validation
    * \[ ] SQL injection prevention
  * \[ ] Hosting setup:
    * \[ ] Database: Supabase (PostgreSQL)
    * \[ ] Backend API: Deploy to Railway/Render/Fly.io (or Supabase Edge Functions)
    * \[ ] Environment variables configuration
    * \[ ] Database migration scripts
    * \[ ] Backup strategy
    * \[ ] Supabase keep-alive mechanism:
      * \[ ] Set up weekly scheduled task to prevent database pausing
      * \[ ] Option 1: Supabase Edge Function with pg_cron (PostgreSQL extension)
      * \[ ] Option 2: External cron service (cron-job.org/EasyCron) that pings database weekly
      * \[ ] Option 3: Simple scheduled query (SELECT 1) to keep connection active
      * \[ ] Document keep-alive setup in deployment guide

* \[ ] Implement Hosted Backend adapter (frontend)
  * \[ ] API client with authentication
  * \[ ] Submit participant results
  * \[ ] Check study status
  * \[ ] Update study status
  * \[ ] Fetch study configuration
  * \[ ] Error handling and retry logic
  * \[ ] Token refresh logic

* \[x] Create storage configuration UI
  * \[x] Storage type selector (Hosted Backend / Custom API / Local Download)
  * \[ ] Default to "Hosted Backend" with upgrade/pricing info
  * \[ ] Hosted Backend configuration:
    * \[ ] User registration/login flow
    * \[ ] API endpoint configuration (defaults to hosted service)
    * \[ ] Authentication token management
    * \[ ] Account status and subscription info
    * \[ ] Pricing/payment integration (Stripe/Paddle)
  * \[x] Custom API configuration (optional, free/BYOS):
    * \[x] API base URL input (e.g., https://api.example.com)
    * \[x] Authentication method selector (API Key / Bearer Token / Custom Headers)
    * \[x] Authentication credentials input (masked in UI)
    * \[ ] Optional custom headers configuration
    * \[x] "Free - Bring Your Own Backend" badge
    * \[ ] Link to REST API documentation
  * \[x] Test connection button
  * \[ ] Connection status indicator

* \[x] Implement Custom API adapter (optional, free/BYOS)
  * \[x] Generic REST API client with configurable base URL and headers
  * \[x] Save study configuration (POST /studies or PUT /studies/:id)
  * \[x] Submit participant results (POST /studies/:studyId/results)
  * \[x] Check study status (GET /studies/:studyId/status)
  * \[x] Update study status (PUT /studies/:studyId/status)
  * \[x] Fetch study configuration (GET /studies/:studyId)
  * \[x] Test connection functionality
  * \[x] Error handling and retry logic
  * \[x] Support for standard HTTP authentication methods

* \[x] Create storage adapter factory
  * \[x] Factory utility to create adapter instances from storage config
  * \[x] Support for Custom API and Local Download adapters

* \[ ] Create documentation
  * \[ ] Hosted Backend setup guide:
    * \[ ] Account creation and login
    * \[ ] Pricing and subscription plans
    * \[ ] API documentation
    * \[ ] Data privacy and security information
  * \[ ] Custom API setup guide (free/BYOS option):
    * \[ ] REST API specification document:
      * \[ ] Endpoint documentation:
        * \[ ] POST /studies/:studyId/results - Submit participant results
        * \[ ] GET /studies/:studyId/status - Check study status
        * \[ ] PUT /studies/:studyId/status - Update study status
        * \[ ] GET /studies/:studyId - Fetch study configuration
      * \[ ] Request/response payload schemas
      * \[ ] Authentication requirements
      * \[ ] Example requests and responses
    * \[ ] Implementation examples:
      * \[ ] Simple Express.js server example
      * \[ ] Simple Python/FastAPI server example
      * \[ ] Common automation platforms (Power Automate, n8n, Zapier, etc.)
    * \[ ] "Free - Bring Your Own Backend" explanation
    * \[ ] Data privacy and security recommendations

* \[ ] Study status management in Study Library
  * \[ ] Display study status (Active/Closed/Draft) in study list/library
  * \[ ] Toggle study status (open/close) functionality
  * \[ ] Status updates via hosted backend API
  * \[ ] Status updates via custom API (if custom API storage selected)

* \[x] Local storage persistence for analyzer data (legacy - for BYOS users)
  * \[x] Auto-save loaded dataset
  * \[x] Persist upload form inputs (tree text, task instructions, expected paths)

* \[x] Implement Local Download adapter (for testing/development)
  * \[ ] Save to localStorage during test
  * \[x] Export results as CSV/JSON (Excel format with analyzer-compatible columns)

## Phase 3: Study Sharing \& Loading

* \[x] Create study configuration JSON schema
  * \[x] Include all study config data (tree, tasks, settings, storage config)
  * \[x] Include metadata (name, creator, timestamps, study ID)
  * \[x] Use cryptographically secure study IDs (UUIDs, not sequential)
  * \[x] Add schema version field for future compatibility
  * \[x] Define JSON structure based on StudyConfig interface

* \[x] Build study save/publish functionality (Creator page)
  * \[x] Rename "Export" tab to "Launch Study" tab in Creator
  * \[ ] Auto-save draft studies (on changes or manual save):
    * \[ ] Hosted backend: Auto-save to backend API (POST /api/studies or PUT /api/studies/:id)
    * \[x] Custom API: Save to custom API endpoint (POST /studies or PUT /studies/:id)
    * \[x] Local Download: Save to localStorage only
  * \[x] Mark study as "draft" or "published" status
  * \[x] Store study config to storage when publishing:
    * \[ ] Hosted backend: Automatically on save (drafts and published studies)
    * \[x] Custom API: On publish to custom API endpoint
    * \[x] Local Download: localStorage only (no remote storage)
  * \[x] Generate shareable participant link with study ID only
  * \[x] Link format: `/test/:studyId` (e.g., `/test/study-abc123`)
  * \[x] Only published studies can be shared via participant link
  * \[x] Validation before publishing:
    * \[x] Ensure tree structure is not empty
    * \[x] Ensure at least one task is defined
    * \[x] Ensure storage configuration is valid
    * \[x] Show validation errors if requirements not met

* \[x] Build Launch Study UI (Creator "Launch Study" tab - renamed from Export)
  * \[x] Study status indicator (Draft / Published)
  * \[x] "Publish Study" button (only for draft studies)
  * \[x] "Unpublish Study" button (only for published studies - makes it draft again)
  * \[x] Display generated shareable participant link (only when published)
  * \[x] Copy link to clipboard button
  * \[ ] QR code generation for mobile testing
  * \[ ] Download QR code as image
  * \[ ] Web Share API integration (optional, for native sharing)
  * \[x] Link validation and error handling
  * \[x] Study status management:
    * \[x] Show current status (Draft/Published)
    * \[x] Show publish date if published
    * \[ ] Show participant count (if available from storage)
  * \[x] Storage-specific publish behavior:
    * \[ ] Hosted Backend: Save to backend API, show success/error
    * \[x] Custom API: Save to custom API, show success/error
    * \[x] Local Download: Save to localStorage, show instructions for sharing
  * \[x] Export study configuration JSON (Step 1 - Build First):
    * \[x] "Download Study Config" button in Launch Study tab
    * \[x] Downloads complete study configuration as JSON file
    * \[x] File format: `{study-name}-config.json`
    * \[x] Includes all StudyConfig data (tree, tasks, settings, storage, metadata)
    * \[x] Includes schema version for future compatibility
    * \[x] For backup and external sharing
    * \[x] This defines the schema that Analyzer will import

* \[ ] Build Export Results functionality (Creator "Launch Study" tab)
  * \[ ] Show results section only if study has been published and has participants
  * \[ ] Display participant count and last updated timestamp
  * \[ ] Storage-specific export workflows:
    * \[ ] Local Download storage:
      * \[ ] Instructions for data collection:
        * \[ ] Explain that participants download Excel files after completing test
        * \[ ] Provide instructions for collecting files from participants
        * \[ ] Explain file naming convention
        * \[ ] Show example of what participant download looks like
      * \[ ] Instructions for loading into Analyzer:
        * \[ ] Guide users to go to Analyzer page
        * \[ ] Explain how to upload collected Excel files
        * \[ ] Explain that they can upload multiple files (one per participant)
        * \[ ] Or combine all participant files into one Excel file with multiple rows
        * \[ ] Explain data format requirements (analyzer-compatible columns)
      * \[ ] Template/example of expected data format
    * \[ ] Custom API storage:
      * \[ ] Instructions for exporting from custom backend:
        * \[ ] Explain how to export results from their API/database
        * \[ ] Provide example API calls to fetch results (GET /studies/:id/results)
        * \[ ] Explain expected data format (analyzer-compatible CSV/Excel)
        * \[ ] Provide data format validation checklist
      * \[ ] Instructions for loading into Analyzer:
        * \[ ] Guide users to export data from their backend in correct format
        * \[ ] Guide users to Analyzer page to upload exported file
        * \[ ] Validate data format before upload
      * \[ ] Link to REST API documentation for their backend
    * \[ ] Hosted Backend storage:
      * \[ ] "Open in Analyzer" button (direct integration):
        * \[ ] Fetch all participant results from backend API (GET /api/studies/:id/results)
        * \[ ] Format results in analyzer-compatible format
        * \[ ] Automatically load into Analyzer page with study data
        * \[ ] Show loading state during data fetch
        * \[ ] Handle errors gracefully (network, auth, etc.)
      * \[ ] Alternative: "Download Results" button:
        * \[ ] Export all results as Excel file
        * \[ ] Download file for offline analysis or backup
        * \[ ] Include all required analyzer-compatible columns
      * \[ ] Show participant count and data summary
      * \[ ] Show last updated timestamp
      * \[ ] Show study status (Active/Closed)

* \[ ] Build Study Library (rename from Analyzer page)
  * \[ ] Unified interface for both storage types (hosted backend and BYOS)
  * \[ ] Study Library view:
    * \[ ] Study grid/list with metadata (name, creator, status, dates, participant count)
    * \[ ] Filter by status (Draft / Active / Closed)
    * \[ ] Search studies by name
    * \[ ] Sort by date, name, status
  * \[ ] For Hosted Backend users:
    * \[ ] Fetch all studies from backend API (GET /api/studies)
    * \[ ] Display all studies (drafts, active, closed)
    * \[ ] Auto-sync with backend on load
    * \[ ] Click to open study for viewing/editing
    * \[ ] Delete study (with confirmation)
    * \[ ] Studies automatically appear after creation/save
  * \[ ] For BYOS (Custom API / Local Download) users:
    * \[ ] Manual import workflow (same interface, different data source)
    * \[x] Load study from exported JSON file (Step 2 - Build After Export):
      * \[x] Add JSON config file upload option in Analyzer UploadView
      * \[x] Parse StudyConfig JSON file
      * \[x] Extract tree structure and tasks from config
      * \[x] Pre-fill tree structure and task instructions in upload form
      * \[x] Validate JSON schema version compatibility
      * \[x] Show error if JSON format is invalid or incompatible
    * \[ ] Load dataset/results file (CSV/Excel) - dual-file upload:
      * \[ ] After JSON config is loaded, upload Excel/CSV results file
      * \[ ] Match dataset to study configuration (validate task count matches)
      * \[ ] Show validation errors if tasks don't match
    * \[ ] Local storage persistence for imported studies
    * \[ ] Delete studies from local library
  * \[ ] Study actions:
    * \[ ] View study details and results
    * \[ ] Edit study (opens Creator with study loaded)
    * \[ ] Duplicate/clone study
    * \[ ] Export study configuration (JSON download)
    * \[ ] Export Results (see storage-specific workflows below)
    * \[ ] Delete study
    * \[ ] Toggle study status (Active/Closed) - for hosted backend only
  * \[ ] Export Results in Study Library (same workflows as Creator, but for any study):
    * \[ ] Local Download storage:
      * \[ ] Instructions for data collection and loading into Analyzer
      * \[ ] Template/example of expected data format
    * \[ ] Custom API storage:
      * \[ ] Instructions for exporting from backend and loading into Analyzer
      * \[ ] Link to REST API documentation
    * \[ ] Hosted Backend storage:
      * \[ ] "Open in Analyzer" button (direct integration)
      * \[ ] "Download Results" button (Excel export)
      * \[ ] Show participant count and data summary
  * \[ ] Study Library routing:
    * \[ ] Update route from `/analyze` to `/library`
    * \[ ] Update navigation and links throughout app

## Phase 4: Participant Experience

* \[ ] Create participant view layout
* \[ ] Build welcome/instructions screen
* \[ ] Implement study config loading on participant view
  * \[ ] Extract study ID from route parameter (`/test/:studyId`)
  * \[ ] Try hosted backend API first (default)
    * \[ ] Fallback to custom API if backend fails (for backward compatibility)
  * \[ ] Fetch study configuration:
    * \[ ] From hosted backend API (`GET /api/studies/:studyId`) - primary
    * \[ ] From custom API endpoint (`GET /studies/:studyId`) - BYOS option
  * \[ ] Handle loading states (loading spinner)
  * \[ ] Handle errors (study not found, network errors, invalid credentials)
  * \[ ] Display error messages gracefully
* \[ ] Implement study status check on load
  * \[ ] Check status via hosted backend API (default)
    * \[ ] Check status via custom API (if custom API storage)
  * \[ ] Show "Study Closed" message if inactive
  * \[ ] Handle status check errors gracefully

* \[ ] Implement interactive tree component

  * \[ ] Expand/collapse navigation
  * \[ ] Breadcrumb trail
  * \[ ] Selection feedback
  * \[x] "I'd find it here" button on last clicked node (from preview)

* \[ ] Build task progression system

  * \[ ] Task display
  * \[ ] Progress indicator
  * \[ ] Navigation between tasks

* \[ ] Implement data tracking

  * \[ ] Click/path tracking
  * \[ ] Time tracking (active time only)
  * \[ ] Task completion detection
  * \[ ] Track all required data points in analyzer-compatible format (see Phase 5 for format specification)

## Phase 5: Data Submission

* \[ ] Required Data Format for Analyzer Compatibility
  * \[ ] Data format MUST align with analyzer's data-parser.ts requirements
  * \[ ] Participant Metadata (required columns):
    * \[ ] Participant ID - Unique identifier (e.g., "P001", "P002")
    * \[ ] Status - Either "Completed" or "Abandoned"
    * \[ ] Start Time (UTC) - ISO timestamp when test started
    * \[ ] End Time (UTC) - ISO timestamp when test ended (or null if abandoned)
    * \[ ] Time Taken - Total duration in HH:MM:SS format (e.g., "00:05:23")
  * \[ ] For Each Task (Task 1, Task 2, Task 3, etc.):
    * \[ ] Task X Path Taken - The full path the participant selected (e.g., "Home/Products/Electronics/Laptops")
    * \[ ] Task X Path Outcome - One of:
      * \[ ] "Direct Success" - Found correct answer directly
      * \[ ] "Indirect Success" - Found correct answer but wandered
      * \[ ] "Failure" - Ended at wrong location
      * \[ ] "Skip" - Skipped the task
    * \[ ] Task X: How confident are you with your answer? - Confidence rating (1-5 scale, as number)
    * \[ ] Task X Time - Time spent on this specific task in seconds (as number)
  * \[ ] Implementation requirements:
    * \[ ] Track all required data points during participant test (Phase 4)
    * \[ ] Export to CSV/Excel in the exact format above
    * \[ ] Store data according to the study's storage configuration:
      * \[ ] Local download: Generate CSV/Excel file with all required columns
      * \[ ] Hosted backend: POST data in this structure (JSON format, backend converts to CSV/Excel)
      * \[ ] Custom API: POST data in this structure (JSON format, custom backend handles conversion)

* \[ ] Create data submission service
  * \[ ] Format participant data according to analyzer-compatible format
  * \[ ] Generate CSV/Excel export with all required columns
  * \[ ] Convert internal data structure to required format:
    * \[ ] Participant metadata (ID, Status, timestamps, duration)
    * \[ ] Task results (path taken, outcome, confidence, time) for each task
    * \[ ] Ensure column names match exactly: "Participant ID", "Status", "Start Time (UTC)", "End Time (UTC)", "Time Taken", "Task X Path Taken", "Task X Path Outcome", "Task X: How confident are you with your answer?", "Task X Time"
* \[ ] Implement adapter dispatch logic
  * \[ ] Route to appropriate adapter based on storage config:
    * \[ ] Hosted Backend adapter (default, if hosted backend selected)
      * \[ ] Submit data in JSON format matching required structure
      * \[ ] Backend converts to CSV/Excel for storage/export
    * \[ ] Custom API adapter (if custom API storage selected - free/BYOS)
      * \[ ] Submit data in JSON format matching required structure
      * \[ ] Custom backend must handle conversion to CSV/Excel if needed
    * \[ ] Local download adapter (if local-download selected)
      * \[ ] Generate CSV/Excel file with all required columns
      * \[ ] Trigger browser download
  * \[ ] Handle status check before submission
* \[ ] Add retry logic for failed submissions
* \[ ] Show completion message
* \[ ] Handle errors gracefully
  * \[ ] Network errors
  * \[ ] Study closed errors
  * \[ ] Authentication errors (hosted backend)
    * \[ ] Invalid custom API URL errors (custom API storage)
  * \[ ] Backend API errors

## Phase 6: Integration \& Testing

* \[ ] End-to-end testing (creator → participant → data)
* \[ ] UI/UX polish
* \[x] Documentation

  * \[x] User guide for creating studies (Help page)
  * \[ ] Setup guides for storage options
    * \[ ] Hosted Backend (primary, paid):
      * \[ ] Account creation and login
      * \[ ] Pricing and subscription information
      * \[ ] API usage documentation
      * \[ ] Data privacy and security
    * \[ ] Custom API storage (optional, free/BYOS):
      * \[ ] REST API specification documentation
      * \[ ] Implementation examples (Express, FastAPI)
      * \[ ] Common automation platform examples
      * \[ ] "Free - Bring Your Own Backend" explanation
  * \[ ] Participant instructions

* \[ ] Accessibility improvements

## Phase 7: Business Model \& Monetization

* \[ ] Pricing strategy
  * \[ ] Define subscription tiers (Free, Pro, Enterprise)
  * \[ ] Feature gating:
    * \[ ] Free tier: Custom API (BYOS) only, limited studies
    * \[ ] Paid tier: Hosted backend, unlimited studies, priority support
  * \[ ] Pricing page UI
  * \[ ] Feature comparison table

* \[ ] Payment integration
  * \[ ] Stripe or Paddle integration
  * \[ ] Subscription management
  * \[ ] Payment processing
  * \[ ] Invoice generation
  * \[ ] Subscription status tracking

* \[ ] User account management
  * \[ ] Registration flow
  * \[ ] Login/logout functionality
  * \[ ] Account settings page
  * \[ ] Subscription management page
  * \[ ] Usage statistics dashboard

* \[ ] License model
    * \[ ] Open source license for custom API (BYOS) functionality
  * \[ ] Commercial license for hosted backend
  * \[ ] License documentation

## Phase 8: Security \& Privacy

* \[ ] Security implementation
  * \[ ] Secure study ID generation (UUIDs, not sequential/guessable)
  * \[ ] Credential masking in UI (show only last 4 characters)
  * \[ ] HTTPS enforcement and warnings (detect HTTP usage)
  * \[ ] Error message sanitization (generic errors for users, detailed only in dev)
  * \[ ] Dependency security scanning (regular npm audit)
  * \[ ] CORS configuration guidance for webhook/backend integrations

* \[ ] Privacy features
  * \[ ] Privacy policy template (GDPR-compliant)
  * \[ ] Data minimization guidance documentation
  * \[ ] Consent mechanism documentation for participant data collection
  * \[ ] Clear data functionality (clear localStorage on demand)
  * \[ ] Data retention policies documentation
  * \[ ] Shared device warnings (localStorage security notice)

* \[ ] Access control
  * \[ ] Optional study password protection
  * \[ ] Access logging/audit trail (optional, via storage adapter)
    * \[ ] Rate limiting guidance for custom API endpoints
  * \[ ] Study ID validation and error handling

* \[ ] Storage security
  * \[ ] Hosted backend security:
    * \[ ] API authentication (JWT tokens)
    * \[ ] Rate limiting implementation
    * \[ ] Input validation and sanitization
    * \[ ] SQL injection prevention
    * \[ ] HTTPS enforcement
  * \[ ] Custom API security (BYOS):
    * \[ ] HTTPS requirement documentation
    * \[ ] Authentication recommendations
    * \[ ] API security best practices guide
  * \[ ] Credential storage best practices (localStorage warnings)

* \[ ] Compliance documentation
  * \[ ] GDPR compliance checklist
  * \[ ] HIPAA considerations (if applicable)
  * \[ ] Data processing agreement template
  * \[ ] Privacy by design principles documentation
  * \[ ] Data export functionality (for right to data portability)
  * \[ ] Data deletion procedures documentation
