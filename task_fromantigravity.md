# Tree Test Suite Implementation

## Phase 1: Study Creator Foundation

* \[x] Create tree structure data types and interfaces
* \[x] Build Tree Editor component

  * \[x] Add/edit/delete nodes
  * \[x] Set node links/destinations
  * \[x] Update styling to match analyzer design

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

  * \[x] Local storage persistence for study data
  * \[x] Auto-save on changes
  * \[x] Editable study name and creator name
  * \[x] Single study limitation (one study at a time in Creator mode)
  * \[x] Local storage warning tooltip

## Phase 2: Storage Configuration

**Architecture:** Hosted backend (primary, paid) + Custom API (optional, free/BYOS)

* \[ ] Define storage adapter interface
  * \[ ] submit(result: ParticipantResult)
  * \[ ] checkStatus(studyId: string)
  * \[ ] updateStatus(studyId: string, status: 'active' | 'closed')
  * \[ ] fetchConfig(studyId: string)
  * \[ ] testConnection()

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
    * \[ ] POST /api/studies - Create study
    * \[ ] GET /api/studies/:id - Get study config
    * \[ ] PUT /api/studies/:id - Update study
    * \[ ] DELETE /api/studies/:id - Delete study
    * \[ ] POST /api/studies/:id/results - Submit participant results
    * \[ ] GET /api/studies/:id/status - Check study status
    * \[ ] PUT /api/studies/:id/status - Update study status
  * \[ ] Database schema:
    * \[ ] Users table (id, email, password_hash, created_at)
    * \[ ] Studies table (id, user_id, name, config_json, status, created_at)
    * \[ ] Results table (id, study_id, participant_id, results_json, submitted_at)
  * \[ ] Security:
    * \[ ] Password hashing (bcrypt)
    * \[ ] JWT token authentication
    * \[ ] Rate limiting
    * \[ ] Input validation
    * \[ ] SQL injection prevention
  * \[ ] Hosting setup:
    * \[ ] Deploy to Railway/Render/Fly.io
    * \[ ] Environment variables configuration
    * \[ ] Database migration scripts
    * \[ ] Backup strategy

* \[ ] Implement Hosted Backend adapter (frontend)
  * \[ ] API client with authentication
  * \[ ] Submit participant results
  * \[ ] Check study status
  * \[ ] Update study status
  * \[ ] Fetch study configuration
  * \[ ] Error handling and retry logic
  * \[ ] Token refresh logic

* \[ ] Create storage configuration UI
  * \[ ] Storage type selector (Hosted Backend / Custom API / Local Download)
  * \[ ] Default to "Hosted Backend" with upgrade/pricing info
  * \[ ] Hosted Backend configuration:
    * \[ ] User registration/login flow
    * \[ ] API endpoint configuration (defaults to hosted service)
    * \[ ] Authentication token management
    * \[ ] Account status and subscription info
    * \[ ] Pricing/payment integration (Stripe/Paddle)
  * \[ ] Custom API configuration (optional, free/BYOS):
    * \[ ] API base URL input (e.g., https://api.example.com)
    * \[ ] Authentication method selector (API Key / Bearer Token / Custom Headers)
    * \[ ] Authentication credentials input (masked in UI)
    * \[ ] Optional custom headers configuration
    * \[ ] "Free - Bring Your Own Backend" badge
    * \[ ] Link to REST API documentation
  * \[ ] Test connection button
  * \[ ] Connection status indicator

* \[ ] Implement Custom API adapter (optional, free/BYOS)
  * \[ ] Generic REST API client with configurable base URL and headers
  * \[ ] Submit participant results (POST /studies/:studyId/results)
  * \[ ] Check study status (GET /studies/:studyId/status)
  * \[ ] Update study status (PUT /studies/:studyId/status)
  * \[ ] Fetch study configuration (GET /studies/:studyId)
  * \[ ] Test connection functionality
  * \[ ] Error handling and retry logic
  * \[ ] Support for standard HTTP authentication methods

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

* \[ ] Study status management in Analyzer
  * \[ ] Display study status (Active/Closed) in study list/library
  * \[ ] Toggle study status (open/close) functionality
  * \[ ] Status updates via hosted backend API
  * \[ ] Status updates via custom API (if custom API storage selected)

* \[x] Local storage persistence for analyzer data
  * \[x] Auto-save loaded dataset
  * \[x] Persist upload form inputs (tree text, task instructions, expected paths)

* \[ ] Implement Local Download adapter (for testing/development)
  * \[ ] Save to localStorage during test
  * \[ ] Export results as CSV/JSON

## Phase 3: Study Sharing \& Loading

* \[ ] Create study configuration JSON schema
  * \[ ] Include all study config data (tree, tasks, settings, storage config)
  * \[ ] Include metadata (name, creator, timestamps, study ID)
  * \[ ] Use cryptographically secure study IDs (UUIDs, not sequential)

* \[ ] Build study export functionality (Creator page)
  * \[ ] Generate complete study configuration JSON
  * \[ ] Download JSON file option (for analyzer import)
  * \[ ] Export includes all data needed for analyzer import
  * \[ ] Store study config to storage (on export/share):
    * \[ ] Via hosted backend API (default, if hosted backend selected)
    * \[ ] Via custom API if custom API storage selected
    * \[ ] Skip storage if local-download selected
  * \[ ] Generate shareable participant link with study ID only
  * \[ ] Link format: `/test/:studyId` (e.g., `/test/study-abc123`)

* \[ ] Build participant link sharing UI (Creator Export tab)
  * \[ ] Display generated shareable link
  * \[ ] Copy link to clipboard button
  * \[ ] QR code generation for mobile testing
  * \[ ] Download QR code as image
  * \[ ] Web Share API integration (optional, for native sharing)
  * \[ ] Link validation and error handling

* \[ ] Build study library/loader (Analyzer page)
  * \[ ] Study library view (multiple studies supported)
  * \[ ] Load study from exported JSON file
  * \[ ] Display study list/library with metadata
  * \[ ] Switch between loaded studies
  * \[ ] Local storage persistence for study library
  * \[ ] Delete studies from library

* \[ ] Dual-file upload workflow (Analyzer)
  * \[ ] Upload study configuration JSON (from Creator export)
  * \[ ] Upload dataset/results file (CSV/Excel)
  * \[ ] Validate both files are provided
  * \[ ] Match dataset to study configuration
  * \[ ] One-click import: upload both files together

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

## Phase 5: Data Submission

* \[ ] Create data submission service
* \[ ] Implement adapter dispatch logic
  * \[ ] Route to appropriate adapter based on storage config:
    * \[ ] Hosted Backend adapter (default, if hosted backend selected)
    * \[ ] Custom API adapter (if custom API storage selected - free/BYOS)
    * \[ ] Local download adapter (if local-download selected)
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
