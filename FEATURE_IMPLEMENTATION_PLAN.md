# Feature Implementation Plan

## Overview

This document outlines the implementation plan for two major features:
1. **Share Analyzer Results** - Share results with optional password protection and real-time updates
2. **Parent Node Success Rate** - Calculate success rates at different tree hierarchy levels

---

## Feature 1: Share Analyzer Results with Password Protection

### Requirements
- Share analyzer results via a shareable link
- Optional password protection
- Real-time updates when new responses come in to the original study
- Read-only view for shared links
- No backend required (uses localStorage)

### Architecture Overview

The sharing feature will be implemented as a separate module to keep concerns separated and maintainable.

#### Key Design Decisions
- **Storage**: Share links stored in localStorage (no backend needed)
- **Password**: Client-side hashing using Web Crypto API (no external dependencies)
- **Updates**: Manual refresh button - users click to check for updates (no automatic polling)
- **Security**: Passwords are hashed, never stored in plain text
- **URL Structure**: `/share/:shareId` with optional `?password=...` query param

### File Structure

```
src/
├── lib/
│   └── sharing/
│       ├── types.ts                    # Share link types and interfaces
│       ├── share-manager.ts            # Core sharing logic (create, validate, store)
│       └── password-utils.ts          # Password hashing/verification
│
├── components/
│   └── sharing/
│       ├── ShareDialog.tsx            # Share button & dialog UI
│       ├── SharedViewLayout.tsx       # Read-only dashboard for shared links
│       └── PasswordPrompt.tsx         # Password entry component
│
└── pages/
    └── SharedAnalyzer.tsx              # Route handler for /share/:shareId
```

### Implementation Details

#### 1. Data Model (`lib/sharing/types.ts`)

```typescript
export interface ShareLink {
  id: string;                    // Unique share ID (e.g., "share-abc123")
  studyId: string;               // Links to original UploadedData.id
  passwordHash?: string;         // Optional bcrypt/Web Crypto hash
  createdAt: string;             // ISO timestamp
  expiresAt?: string;             // Optional expiration (ISO timestamp)
  accessCount: number;            // Track how many times accessed
  lastAccessedAt?: string;       // Last access timestamp
}

export interface ShareLinkConfig {
  password?: string;              // Plain password (will be hashed)
  expiresInDays?: number;          // Optional expiration (default: never)
}

export interface ShareLinkValidation {
  valid: boolean;
  shareLink?: ShareLink;
  error?: string;
}
```

#### 2. Storage Strategy (`lib/sharing/share-manager.ts`)

**Storage Key**: `tree-test-share-links`

**Structure**:
```typescript
// localStorage structure
{
  "share-abc123": {
    id: "share-abc123",
    studyId: "study-xyz789",
    passwordHash: "...",
    createdAt: "2025-01-06T...",
    accessCount: 5
  },
  "share-def456": { ... }
}
```

**Functions**:
- `createShareLink(studyId: string, config?: ShareLinkConfig): ShareLink`
  - Generate unique share ID
  - Hash password if provided
  - Store in localStorage
  - Return share link with full URL

- `getShareLink(shareId: string): ShareLink | null`
  - Retrieve from localStorage
  - Check expiration
  - Increment access count

- `validateShareLink(shareId: string, password?: string): ShareLinkValidation`
  - Check if share link exists
  - Verify password if required
  - Check expiration
  - Return validation result

- `deleteShareLink(shareId: string): void`
  - Remove from localStorage

- `getShareLinksForStudy(studyId: string): ShareLink[]`
  - Get all share links for a specific study

#### 3. Password Protection (`lib/sharing/password-utils.ts`)

**Approach**: Use Web Crypto API (built into browsers, no dependencies)

**Functions**:
- `hashPassword(password: string): Promise<string>`
  - Use SubtleCrypto API with SHA-256
  - Convert to base64 for storage
  - Returns: `"sha256:base64hash..."`

- `verifyPassword(password: string, hash: string): Promise<boolean>`
  - Hash provided password
  - Compare with stored hash
  - Returns boolean

**Security Notes**:
- Passwords are hashed, never stored in plain text
- Uses browser's native crypto API (no external libraries)
- Hash format: `"sha256:base64encodedhash"` for future extensibility

#### 4. Manual Refresh (`lib/sharing/share-manager.ts`)

**Approach**: Manual refresh button - no automatic polling

**Functions**:
- `checkForUpdates(studyId: string, lastUpdatedAt: string): { hasUpdates: boolean; updatedData?: UploadedData }`
  - Check if study data has been updated since last view
  - Compare `updatedAt` timestamps
  - Return whether updates are available and the updated data if so

**Implementation**:
```typescript
export function checkForUpdates(
  studyId: string,
  lastUpdatedAt: string
): { hasUpdates: boolean; updatedData?: UploadedData } {
  const studies = loadStudiesFromStorage();
  const currentStudy = studies.find(s => s.id === studyId);
  
  if (!currentStudy) {
    return { hasUpdates: false };
  }
  
  const hasUpdates = currentStudy.updatedAt !== lastUpdatedAt;
  
  return {
    hasUpdates,
    updatedData: hasUpdates ? currentStudy : undefined
  };
}
```

**UI Feedback**:
- "Refresh" button in SharedViewLayout header
- Show loading state while checking
- Display "Last updated: [timestamp]" 
- Show notification if new data is available after refresh

#### 5. UI Components

##### ShareDialog.tsx
**Location**: `components/sharing/ShareDialog.tsx`

**Props**:
```typescript
interface ShareDialogProps {
  studyId: string;
  studyName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

**Features**:
- Generate share link button
- Toggle for password protection
- Password input (if enabled)
- Copy link button with feedback
- Display full shareable URL
- Show existing share links for this study
- Delete share link option

**UI Flow**:
1. User clicks "Share" button in DashboardLayout
2. Dialog opens
3. User can:
   - Toggle password protection
   - Enter password (if enabled)
   - Click "Generate Link"
   - Copy link to clipboard
   - See list of existing share links

##### SharedViewLayout.tsx
**Location**: `components/sharing/SharedViewLayout.tsx`

**Props**:
```typescript
interface SharedViewLayoutProps {
  data: UploadedData;
  shareLink: ShareLink;
  onRefresh: () => void;
  isRefreshing?: boolean;
}
```

**Features**:
- Read-only version of DashboardLayout
- Same tabs: Overview, Tasks, Participants, Pietree, Export
- No edit/delete actions
- "Shared View" badge in header
- "Refresh" button to check for updates
- Last updated timestamp display
- Loading state during refresh

**Differences from regular DashboardLayout**:
- No edit name/creator
- No delete button
- No share button (already shared)
- Show "Shared View" indicator
- "Refresh" button to check for updates
- Display last updated timestamp
- Disable all edit interactions

##### PasswordPrompt.tsx
**Location**: `components/sharing/PasswordPrompt.tsx`

**Props**:
```typescript
interface PasswordPromptProps {
  open: boolean;
  onPasswordSubmit: (password: string) => void;
  onCancel: () => void;
  error?: string;
}
```

**Features**:
- Modal dialog for password entry
- Password input field
- Submit button
- Error message display
- Cancel option

#### 6. Routing Integration

**New Route**: `/share/:shareId`

**File**: `pages/SharedAnalyzer.tsx`

**Implementation**:
```typescript
export function SharedAnalyzer() {
  const { shareId } = useParams<{ shareId: string }>();
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [studyData, setStudyData] = useState<UploadedData | null>(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load share link
  useEffect(() => {
    const link = getShareLink(shareId);
    if (!link) {
      // Handle not found
      return;
    }
    
    setShareLink(link);
    setPasswordRequired(!!link.passwordHash);
    
    // If password required, show prompt
    // Otherwise, load study data
  }, [shareId]);

  // Handle password submission
  const handlePasswordSubmit = async (password: string) => {
    const validation = await validateShareLink(shareId, password);
    if (validation.valid && validation.shareLink) {
      setShareLink(validation.shareLink);
      setPasswordRequired(false);
      loadStudyData(validation.shareLink.studyId);
    } else {
      setPasswordError(validation.error || "Invalid password");
    }
  };

  // Handle manual refresh
  const handleRefresh = () => {
    if (!studyData) return;
    
    setIsRefreshing(true);
    
    // Check for updates
    const updateCheck = checkForUpdates(studyData.id, studyData.updatedAt);
    
    if (updateCheck.hasUpdates && updateCheck.updatedData) {
      setStudyData(updateCheck.updatedData);
      // Show notification: "Data updated"
    } else {
      // Show notification: "Already up to date"
    }
    
    setIsRefreshing(false);
  };

  // Render password prompt or shared view
  if (passwordRequired) {
    return <PasswordPrompt ... />;
  }
  
  if (!studyData) {
    return <LoadingState />;
  }
  
  return (
    <SharedViewLayout 
      data={studyData} 
      shareLink={shareLink}
      onRefresh={handleRefresh}
      isRefreshing={isRefreshing}
    />
  );
}
```

**Update App.tsx**:
```typescript
<Route path="/share/:shareId" element={<SharedAnalyzer />} />
```

#### 7. Integration Points

**DashboardLayout.tsx**:
- Add "Share" button in header (next to study name)
- Open ShareDialog when clicked
- Pass studyId and studyName to dialog

**Example Integration**:
```typescript
// In DashboardLayout header
<Button
  variant="outline"
  size="sm"
  onClick={() => setShareDialogOpen(true)}
  className="gap-2"
>
  <Share2 className="h-4 w-4" />
  Share
</Button>

<ShareDialog
  studyId={data.id}
  studyName={data.name || "Untitled Analysis"}
  open={shareDialogOpen}
  onOpenChange={setShareDialogOpen}
/>
```

### Implementation Steps

1. **Create type definitions** (`lib/sharing/types.ts`)
2. **Implement password utilities** (`lib/sharing/password-utils.ts`)
3. **Implement share manager** (`lib/sharing/share-manager.ts`)
   - Include `checkForUpdates()` function
4. **Create PasswordPrompt component** (`components/sharing/PasswordPrompt.tsx`)
6. **Create ShareDialog component** (`components/sharing/ShareDialog.tsx`)
7. **Create SharedViewLayout component** (`components/sharing/SharedViewLayout.tsx`)
8. **Create SharedAnalyzer page** (`pages/SharedAnalyzer.tsx`)
9. **Add route to App.tsx**
10. **Integrate Share button into DashboardLayout.tsx**
11. **Test password protection flow**
12. **Test real-time sync functionality**

### Testing Considerations

- Test share link creation
- Test password protection (correct/incorrect passwords)
- Test password-less sharing
- Test expiration (if implemented)
- Test manual refresh (check for updates)
- Test refresh when no updates available
- Test multiple share links for same study
- Test share link deletion
- Test invalid share link handling

---

## Feature 2: Parent Node Success Rate Calculation

### Requirements
- Calculate success rates at different tree hierarchy levels (1st, 2nd, 3rd level nodes)
- Toggle view in Tasks tab
- Filter to select which level to display
- Include in AI-ready export (all 3 levels by default)
- Example: For path "Home -> Products -> Electronics -> Sale -> Clearance"
  - Level 1: Count reaching "Products" as success
  - Level 2: Count reaching "Electronics" as success
  - Level 3: Count reaching "Sale" as success

### Architecture Overview

The parent node calculation will be a separate module that extends the existing stats calculation system.

#### Key Design Decisions
- **Calculation**: Separate function that can be called independently
- **Storage**: Add to existing `TaskStats` interface
- **UI**: Toggle/filter component in TasksTab
- **Export**: Include all 3 levels in markdown export by default

### File Structure

```
src/
├── lib/
│   └── stats/
│       ├── parent-node-stats.ts       # Parent node calculation logic
│       └── path-utils.ts              # Tree path parsing utilities
│
├── components/
│   └── dashboard/
│       ├── ParentNodeFilter.tsx       # Toggle/filter component
│       └── ParentNodeSuccessView.tsx  # Display component for parent node metrics
│
└── lib/
    └── markdown-generator.ts          # Update to include parent node metrics
```

### Implementation Details

#### 1. Data Model Extension (`lib/types.ts`)

**Update TaskStats interface**:
```typescript
export interface TaskStats {
  // ... existing fields
  stats: {
    // ... existing stats
    parentNodeStats?: {
      level1: {
        rate: number;           // Success rate percentage
        count: number;          // Number who reached this node
        total: number;          // Total participants
        nodeName: string;       // Name of the node (e.g., "Products")
      };
      level2: {
        rate: number;
        count: number;
        total: number;
        nodeName: string;       // e.g., "Electronics"
      };
      level3: {
        rate: number;
        count: number;
        total: number;
        nodeName: string;       // e.g., "Sale"
      };
    };
  };
}
```

#### 2. Path Utilities (`lib/stats/path-utils.ts`)

**Functions**:

- `parsePath(path: string): string[]`
  - Parse expected answer path format
  - Input: `"Home -> Products -> Electronics -> Sale -> Clearance"`
  - Output: `["Home", "Products", "Electronics", "Sale", "Clearance"]`
  - Handle variations: `"Home/Products/Electronics"` or `"Home > Products > Electronics"`

- `getNodeAtLevel(path: string[], level: number): string | null`
  - Extract node name at specified level (1-indexed)
  - Level 1 = first node after root (index 1)
  - Level 2 = second node (index 2)
  - Level 3 = third node (index 3)
  - Returns `null` if level doesn't exist

- `pathContainsNode(participantPath: string, targetNode: string): boolean`
  - Check if participant's path includes the target node
  - Case-insensitive comparison
  - Handle path formats: `"Home/Products/Electronics"` or `"Home -> Products -> Electronics"`

- `normalizePath(path: string): string`
  - Normalize different path formats to consistent format
  - Convert separators (`->`, `>`, `/`) to consistent format
  - Trim whitespace

**Example Usage**:
```typescript
const expectedPath = "Home -> Products -> Electronics -> Sale -> Clearance";
const parsed = parsePath(expectedPath);
// ["Home", "Products", "Electronics", "Sale", "Clearance"]

const level1Node = getNodeAtLevel(parsed, 1); // "Products"
const level2Node = getNodeAtLevel(parsed, 2); // "Electronics"
const level3Node = getNodeAtLevel(parsed, 3); // "Sale"

const participantPath = "Home/Products/Electronics/Other";
const reachedLevel1 = pathContainsNode(participantPath, "Products"); // true
const reachedLevel2 = pathContainsNode(participantPath, "Electronics"); // true
const reachedLevel3 = pathContainsNode(participantPath, "Sale"); // false
```

#### 3. Calculation Logic (`lib/stats/parent-node-stats.ts`)

**Main Function**:
```typescript
export function calculateParentNodeStats(
  task: { expectedAnswer: string },
  participants: Participant[]
): ParentNodeStats | null {
  // Parse expected path
  const expectedPath = parsePath(task.expectedAnswer);
  
  // Get nodes at each level
  const level1Node = getNodeAtLevel(expectedPath, 1);
  const level2Node = getNodeAtLevel(expectedPath, 2);
  const level3Node = getNodeAtLevel(expectedPath, 3);
  
  // If no levels exist, return null
  if (!level1Node) return null;
  
  // Calculate for each level
  const totalParticipants = participants.length;
  
  const level1Count = participants.filter(p => {
    const result = p.taskResults.find(r => r.taskIndex === task.index);
    if (!result || result.skipped) return false;
    return pathContainsNode(result.pathTaken, level1Node);
  }).length;
  
  const level2Count = level2Node ? participants.filter(p => {
    const result = p.taskResults.find(r => r.taskIndex === task.index);
    if (!result || result.skipped) return false;
    return pathContainsNode(result.pathTaken, level2Node);
  }).length : 0;
  
  const level3Count = level3Node ? participants.filter(p => {
    const result = p.taskResults.find(r => r.taskIndex === task.index);
    if (!result || result.skipped) return false;
    return pathContainsNode(result.pathTaken, level3Node);
  }).length : 0;
  
  return {
    level1: {
      rate: totalParticipants > 0 ? (level1Count / totalParticipants) * 100 : 0,
      count: level1Count,
      total: totalParticipants,
      nodeName: level1Node
    },
    level2: level2Node ? {
      rate: totalParticipants > 0 ? (level2Count / totalParticipants) * 100 : 0,
      count: level2Count,
      total: totalParticipants,
      nodeName: level2Node
    } : null,
    level3: level3Node ? {
      rate: totalParticipants > 0 ? (level3Count / totalParticipants) * 100 : 0,
      count: level3Count,
      total: totalParticipants,
      nodeName: level3Node
    } : null
  };
}
```

**Type Definition**:
```typescript
export interface ParentNodeStats {
  level1: {
    rate: number;
    count: number;
    total: number;
    nodeName: string;
  };
  level2: {
    rate: number;
    count: number;
    total: number;
    nodeName: string;
  } | null;
  level3: {
    rate: number;
    count: number;
    total: number;
    nodeName: string;
  } | null;
}
```

#### 4. Integration with Existing Stats (`lib/stats.ts`)

**Update `calculateTaskStats()` function**:

```typescript
export function calculateTaskStats(data: UploadedData, tree: Item[]): TaskStats[] {
  return data.tasks.map(task => {
    // ... existing calculation code ...
    
    // Calculate parent node stats
    const parentNodeStats = calculateParentNodeStats(task, data.participants);
    
    return {
      ...task,
      // ... existing fields ...
      stats: {
        // ... existing stats ...
        parentNodeStats: parentNodeStats ? {
          level1: parentNodeStats.level1,
          level2: parentNodeStats.level2,
          level3: parentNodeStats.level3
        } : undefined
      }
    };
  });
}
```

#### 5. UI Components

##### ParentNodeFilter.tsx
**Location**: `components/dashboard/ParentNodeFilter.tsx`

**Props**:
```typescript
interface ParentNodeFilterProps {
  enabled: boolean;
  selectedLevel: 1 | 2 | 3 | null;
  onEnabledChange: (enabled: boolean) => void;
  onLevelChange: (level: 1 | 2 | 3 | null) => void;
  availableLevels: (1 | 2 | 3)[]; // Which levels are available for this task
}
```

**Features**:
- Toggle switch: "Show Parent Node Success"
- Dropdown/Radio group: Select level (1, 2, or 3)
- Only show levels that exist in the expected path
- Disable dropdown when toggle is off

**UI Layout**:
```
[Toggle] Show Parent Node Success
[Dropdown] Level: [1st Level ▼] [2nd Level] [3rd Level]
```

##### ParentNodeSuccessView.tsx
**Location**: `components/dashboard/ParentNodeSuccessView.tsx`

**Props**:
```typescript
interface ParentNodeSuccessViewProps {
  stats: {
    rate: number;
    count: number;
    total: number;
    nodeName: string;
  };
  level: 1 | 2 | 3;
}
```

**Features**:
- Display success rate card (similar to existing success rate display)
- Show: "X / Y participants reached [Node Name]"
- Color-coded based on rate (use existing `getMetricColor` function)
- Show percentage with margin of error (if applicable)

**UI Example**:
```
┌─────────────────────────────┐
│  Level 1 Node Success        │
│                              │
│  85%                         │
│  Success Rate                │
│  17 / 20 participants        │
│  reached "Products"          │
│  ±8.0%                       │
└─────────────────────────────┘
```

#### 6. TasksTab Integration

**Update `components/dashboard/TasksTab.tsx`**:

1. **Add state**:
```typescript
const [showParentNodeView, setShowParentNodeView] = useState(false);
const [selectedParentLevel, setSelectedParentLevel] = useState<1 | 2 | 3 | null>(1);
```

2. **Add filter component** (in task selection area):
```typescript
{selectedTask && (
  <ParentNodeFilter
    enabled={showParentNodeView}
    selectedLevel={selectedParentLevel}
    onEnabledChange={setShowParentNodeView}
    onLevelChange={setSelectedParentLevel}
    availableLevels={getAvailableLevels(selectedTask)}
  />
)}
```

3. **Conditionally show parent node view**:
```typescript
{showParentNodeView && selectedTask.stats.parentNodeStats && selectedParentLevel && (
  <ParentNodeSuccessView
    stats={getParentNodeStatsForLevel(selectedTask.stats.parentNodeStats, selectedParentLevel)}
    level={selectedParentLevel}
  />
)}
```

4. **Helper functions**:
```typescript
function getAvailableLevels(task: TaskStats): (1 | 2 | 3)[] {
  const levels: (1 | 2 | 3)[] = [];
  if (task.stats.parentNodeStats?.level1) levels.push(1);
  if (task.stats.parentNodeStats?.level2) levels.push(2);
  if (task.stats.parentNodeStats?.level3) levels.push(3);
  return levels;
}

function getParentNodeStatsForLevel(
  parentNodeStats: NonNullable<TaskStats['stats']['parentNodeStats']>,
  level: 1 | 2 | 3
) {
  switch (level) {
    case 1: return parentNodeStats.level1;
    case 2: return parentNodeStats.level2!;
    case 3: return parentNodeStats.level3!;
  }
}
```

#### 7. Export Integration (`lib/markdown-generator.ts`)

**Update `generateTaskSection()` function**:

Add new section after "Key Metrics":
```markdown
### Parent Node Success Rates

| Level | Node Name | Success Rate | Participants Reached |
|-------|-----------|--------------|---------------------|
| Level 1 | Products | 85% | 17 / 20 |
| Level 2 | Electronics | 70% | 14 / 20 |
| Level 3 | Sale | 60% | 12 / 20 |
```

**Implementation**:
```typescript
function generateParentNodeSection(task: TaskStats): string {
  if (!task.stats.parentNodeStats) {
    return ""; // No parent node stats available
  }
  
  const { level1, level2, level3 } = task.stats.parentNodeStats;
  
  let rows = `| Level | Node Name | Success Rate | Participants Reached |\n`;
  rows += `|-------|-----------|--------------|---------------------|\n`;
  
  rows += `| Level 1 | ${level1.nodeName} | ${level1.rate.toFixed(1)}% | ${level1.count} / ${level1.total} |\n`;
  
  if (level2) {
    rows += `| Level 2 | ${level2.nodeName} | ${level2.rate.toFixed(1)}% | ${level2.count} / ${level2.total} |\n`;
  }
  
  if (level3) {
    rows += `| Level 3 | ${level3.nodeName} | ${level3.rate.toFixed(1)}% | ${level3.count} / ${level3.total} |\n`;
  }
  
  return `### Parent Node Success Rates\n\n${rows}\n\n`;
}
```

**Include in task section**:
```typescript
function generateTaskSection(task: TaskStats, data: UploadedData): string {
  return `
## Task ${task.index}: ${task.description}

### Expected Path(s)
...

### Key Metrics
...

${generateParentNodeSection(task)}

### Results Breakdown
...
  `;
}
```

### Implementation Steps

1. **Create path utilities** (`lib/stats/path-utils.ts`)
   - Implement `parsePath()`
   - Implement `getNodeAtLevel()`
   - Implement `pathContainsNode()`
   - Implement `normalizePath()`
   - Add unit tests (if testing framework available)

2. **Create parent node stats calculation** (`lib/stats/parent-node-stats.ts`)
   - Implement `calculateParentNodeStats()`
   - Define `ParentNodeStats` interface
   - Handle edge cases (no levels, skipped participants, etc.)

3. **Update types** (`lib/types.ts`)
   - Extend `TaskStats` interface with `parentNodeStats`

4. **Update stats calculation** (`lib/stats.ts`)
   - Integrate parent node calculation into `calculateTaskStats()`
   - Ensure it's calculated for all tasks

5. **Create ParentNodeFilter component** (`components/dashboard/ParentNodeFilter.tsx`)
   - Toggle switch
   - Level selector (dropdown or radio group)
   - Handle state changes

6. **Create ParentNodeSuccessView component** (`components/dashboard/ParentNodeSuccessView.tsx`)
   - Display success rate card
   - Format numbers and percentages
   - Apply color coding

7. **Update TasksTab** (`components/dashboard/TasksTab.tsx`)
   - Add state for filter
   - Integrate filter component
   - Conditionally render parent node view
   - Add helper functions

8. **Update markdown generator** (`lib/markdown-generator.ts`)
   - Add `generateParentNodeSection()` function
   - Integrate into `generateTaskSection()`
   - Ensure all 3 levels are included in export

9. **Test with various path formats**
   - Test with `"->"` separator
   - Test with `"/"` separator
   - Test with `">"` separator
   - Test with paths that have fewer than 3 levels

### Edge Cases to Handle

1. **Path Format Variations**:
   - `"Home -> Products -> Electronics"`
   - `"Home/Products/Electronics"`
   - `"Home > Products > Electronics"`
   - `"Home ->Products->Electronics"` (no spaces)

2. **Missing Levels**:
   - Path with only 1 level: Only calculate level1
   - Path with only 2 levels: Calculate level1 and level2
   - Handle gracefully when level doesn't exist

3. **Skipped Participants**:
   - Exclude skipped participants from calculation
   - Only count participants who attempted the task

4. **Case Sensitivity**:
   - Node name matching should be case-insensitive
   - "Products" should match "products" or "PRODUCTS"

5. **Whitespace**:
   - Trim whitespace from node names
   - Handle extra spaces in paths

### Testing Considerations

- Test path parsing with different formats
- Test level extraction (1, 2, 3)
- Test participant path matching
- Test calculation with various scenarios:
  - All participants reach level 1
  - Some reach level 2, some don't
  - None reach level 3
- Test with skipped participants
- Test UI toggle and filter
- Test export includes all levels

---

## Implementation Order

### Recommended Approach: Incremental Development

**Strategy**: Build in small, testable increments. Each step should compile and run without breaking existing functionality.

---

### Phase 1: Parent Node Success Rate (Recommended First)
**Reason**: Simpler, no routing, self-contained feature, can be hidden behind feature flag

#### Step 1: Foundation (Backend Logic)
**Goal**: Build calculation logic without UI changes

1. ✅ Create `lib/stats/path-utils.ts`
   - Write all utility functions
   - Test with various path formats in browser console
   - **No impact on UI yet**

2. ✅ Create `lib/stats/parent-node-stats.ts`
   - Implement calculation function
   - Test with sample data
   - **No impact on UI yet**

3. ✅ Update `lib/types.ts`
   - Add optional `parentNodeStats` field
   - **No breaking changes - all fields optional**

**Testing checkpoint**: Run app, verify no errors, existing functionality unchanged

#### Step 2: Integration (Wire up calculations)
**Goal**: Calculate parent node stats but don't display yet

4. ✅ Update `lib/stats.ts`
   - Add parent node calculation to `calculateTaskStats()`
   - Wrap in try-catch for safety
   - Log results to console for verification
   - **Stats calculated but not shown in UI**

**Testing checkpoint**: 
- Load a study
- Open console
- Verify parent node stats are calculated
- Verify existing UI unchanged

#### Step 3: UI Components (Build display components)
**Goal**: Create UI components but don't integrate yet

5. ✅ Create `components/dashboard/ParentNodeFilter.tsx`
   - Build standalone component
   - Test in isolation (can temporarily add to a test page)
   - **Not visible in TasksTab yet**

6. ✅ Create `components/dashboard/ParentNodeSuccessView.tsx`
   - Build standalone component
   - Test with mock data
   - **Not visible in TasksTab yet**

**Testing checkpoint**: Components build successfully, no errors

#### Step 4: UI Integration (Show in Tasks tab)
**Goal**: Make feature visible and usable

7. ✅ Update `components/dashboard/TasksTab.tsx`
   - Add state for parent node filter
   - Integrate filter and view components
   - Add conditional rendering (hide if no data)
   - **Feature now visible and usable**

**Testing checkpoint**:
- Load old study → Parent node toggle appears, works or shows N/A
- Load new study → Parent node stats display correctly
- Toggle on/off → No errors
- Switch between tasks → Updates correctly

#### Step 5: Export Integration
**Goal**: Include in AI-ready reports

8. ✅ Update `lib/markdown-generator.ts`
   - Add `generateParentNodeSection()` function
   - Integrate into task section
   - Handle missing data gracefully
   - **Export now includes parent node metrics**

**Testing checkpoint**:
- Export old study → Report generates, no parent node section or empty section
- Export new study → Report includes parent node metrics
- Copy to clipboard → Works correctly

#### Step 6: Comprehensive Testing

9. ✅ Test with various scenarios:
   - Studies with different path formats
   - Studies with 1, 2, 3, or more levels
   - Studies with special characters in paths
   - Studies created before the update
   - Edge cases (empty paths, null values, etc.)

**Final checkpoint before deployment**:
- All existing functionality works
- New feature works correctly
- No console errors
- Export includes new metrics
- Old studies display correctly

---

### Phase 2: Share Feature
**Reason**: More complex, requires routing, can be deployed separately

#### Step 1: Core Sharing Logic (Backend)
**Goal**: Build sharing system without UI

1. ✅ Create `lib/sharing/types.ts`
   - Define all interfaces
   - **No code changes, just types**

2. ✅ Create `lib/sharing/password-utils.ts`
   - Implement hashing functions
   - Test in browser console
   - **No impact on app yet**

3. ✅ Create `lib/sharing/share-manager.ts`
   - Implement all CRUD functions
   - Test localStorage operations in console
   - **No impact on app yet**

**Testing checkpoint**: 
- Run functions in console
- Create/get/delete share links
- Verify localStorage structure

#### Step 2: UI Components (Build dialogs)
**Goal**: Create sharing UI without integrating

4. ✅ Create `components/sharing/PasswordPrompt.tsx`
   - Build standalone modal
   - Test with mock handlers
   - **Not visible in app yet**

5. ✅ Create `components/sharing/ShareDialog.tsx`
   - Build dialog with form
   - Test link generation
   - Test copy to clipboard
   - **Not visible in app yet**

**Testing checkpoint**: Components render correctly, no errors

#### Step 3: Shared View Components
**Goal**: Build read-only dashboard

6. ✅ Create `components/sharing/SharedViewLayout.tsx`
   - Copy from DashboardLayout
   - Remove edit capabilities
   - Add refresh button
   - Add shared view badge
   - **Not accessible yet**

7. ✅ Create `pages/SharedAnalyzer.tsx`
   - Handle routing logic
   - Implement password validation
   - Implement refresh handler
   - **Route not added yet, so not accessible**

**Testing checkpoint**: 
- Access directly via URL typing → Should show not found
- Components build without errors

#### Step 4: Routing & Integration
**Goal**: Make feature accessible

8. ✅ Update `App.tsx`
   - Add new route for `/share/:shareId`
   - **Share links now work**

9. ✅ Update `components/dashboard/DashboardLayout.tsx`
   - Add Share button to header
   - Wire up ShareDialog
   - **Users can now create share links**

**Testing checkpoint**:
- Click Share button → Dialog opens
- Generate link → Link created
- Copy link → Copied successfully
- Visit link → Shared view loads
- Test with password → Works correctly
- Test refresh → Updates correctly

#### Step 5: Comprehensive Testing

10. ✅ Test end-to-end scenarios:
    - Share old study without password
    - Share new study with password
    - Share link with parent node stats
    - Multiple share links for same study
    - Delete share link
    - Invalid share link
    - Expired share link (if implemented)
    - Refresh shared view
    - Access from different browser/incognito

**Final checkpoint before deployment**:
- Share links work reliably
- Password protection works
- Refresh updates data correctly
- No interference with original studies
- localStorage keys are separate

---

### Recommended Deployment Strategy

**Option 1: Deploy Together (After Both Phases Complete)**
- Test both features together
- Deploy in one release
- Easier for users (one update)

**Option 2: Deploy Separately (Safest)**
1. Deploy Phase 1 (Parent Node) first
   - Monitor for issues
   - Fix any bugs
   - Get user feedback

2. Wait 1-2 weeks

3. Deploy Phase 2 (Share Feature)
   - Monitor for issues
   - Both features now live

**Option 3: Feature Flags (Most Flexible)**
- Deploy both features but hidden
- Enable via localStorage flag for testing
- Gradually enable for users
- Can disable quickly if issues arise

```typescript
// Example feature flag
const FEATURE_FLAGS = {
  parentNodeStats: localStorage.getItem('feature_parent_node') === 'true',
  shareFeature: localStorage.getItem('feature_share') === 'true'
};

// Use in code
{FEATURE_FLAGS.parentNodeStats && <ParentNodeFilter ... />}
{FEATURE_FLAGS.shareFeature && <ShareButton ... />}
```

---

## Common Pitfalls to Avoid

### ❌ Pitfall 1: Modifying Existing Data Structures
**DON'T**:
```typescript
// ❌ Changing existing field from optional to required
export interface TaskStats {
  description: string;  // Was optional, now required
}
```

**DO**:
```typescript
// ✅ Keep existing fields as-is, add new ones as optional
export interface TaskStats {
  description?: string;  // Still optional
  parentNodeStats?: { ... };  // New field, also optional
}
```

---

### ❌ Pitfall 2: Assuming Data Exists
**DON'T**:
```typescript
// ❌ Direct access without checking
const level1Rate = task.stats.parentNodeStats.level1.rate;
```

**DO**:
```typescript
// ✅ Optional chaining and null checks
const level1Rate = task.stats.parentNodeStats?.level1?.rate ?? 0;

// ✅ Or explicit checks
if (task.stats.parentNodeStats?.level1) {
  const rate = task.stats.parentNodeStats.level1.rate;
}
```

---

### ❌ Pitfall 3: Throwing Errors on Invalid Data
**DON'T**:
```typescript
// ❌ Throwing errors breaks the entire app
function parsePath(path: string): string[] {
  if (!path) throw new Error('Path is required');
  return path.split('->');
}
```

**DO**:
```typescript
// ✅ Return safe defaults, log errors
function parsePath(path: string): string[] {
  if (!path || typeof path !== 'string') {
    console.warn('Invalid path:', path);
    return [];  // Safe default
  }
  
  try {
    return path.split('->').map(s => s.trim());
  } catch (error) {
    console.error('Path parsing error:', error);
    return [];  // Safe default
  }
}
```

---

### ❌ Pitfall 4: Modifying Original Study Data in Share Feature
**DON'T**:
```typescript
// ❌ Modifying the original study
function handleRefresh() {
  const study = loadStudy(shareLink.studyId);
  study.participants.push(...);  // Modifying original!
  setStudyData(study);
}
```

**DO**:
```typescript
// ✅ Read-only access, deep copy if needed
function handleRefresh() {
  const study = loadStudy(shareLink.studyId);
  const readOnlyCopy = JSON.parse(JSON.stringify(study));
  setStudyData(readOnlyCopy);
}
```

---

### ❌ Pitfall 5: Hardcoding Level Counts
**DON'T**:
```typescript
// ❌ Assuming always 3 levels
<ParentNodeSuccessView 
  level1={stats.level1}
  level2={stats.level2}  // Could be null!
  level3={stats.level3}  // Could be null!
/>
```

**DO**:
```typescript
// ✅ Dynamic based on available levels
{stats.level1 && <ParentNodeSuccessView stats={stats.level1} level={1} />}
{stats.level2 && <ParentNodeSuccessView stats={stats.level2} level={2} />}
{stats.level3 && <ParentNodeSuccessView stats={stats.level3} level={3} />}
```

---

### ❌ Pitfall 6: Not Testing with Real Old Data
**DON'T**:
- Only test with newly created studies
- Assume old data format matches new format

**DO**:
- Export a study from current production
- Load it in dev environment
- Test all new features with it
- Verify nothing breaks

---

### ❌ Pitfall 7: Mixing Storage Keys
**DON'T**:
```typescript
// ❌ Same key for different data
localStorage.setItem('tree-test-studies', JSON.stringify(shareLinks));
localStorage.setItem('tree-test-studies', JSON.stringify(analyzerStudies));
```

**DO**:
```typescript
// ✅ Separate keys for each data type
localStorage.setItem('tree-test-share-links', JSON.stringify(shareLinks));
localStorage.setItem('tree-test-analyzer-studies', JSON.stringify(analyzerStudies));
localStorage.setItem('tree-test-creator-studies', JSON.stringify(creatorStudies));
```

---

### ❌ Pitfall 8: Not Handling Missing TreeStructure
**DON'T**:
```typescript
// ❌ Assuming treeStructure exists
const tree = data.treeStructure;
const firstNode = tree[0].name;  // Could crash!
```

**DO**:
```typescript
// ✅ Handle optional tree structure
const tree = data.treeStructure || [];
const firstNode = tree[0]?.name ?? 'Unknown';
```

---

### ❌ Pitfall 9: Infinite Loops in useEffect
**DON'T**:
```typescript
// ❌ Missing dependencies causes infinite re-renders
useEffect(() => {
  const stats = calculateStats(data);
  setCalculatedStats(stats);
}, []);  // Missing 'data' dependency
```

**DO**:
```typescript
// ✅ Proper dependencies or use useMemo
const calculatedStats = useMemo(() => {
  return calculateStats(data);
}, [data]);

// Or with proper dependencies
useEffect(() => {
  const stats = calculateStats(data);
  setCalculatedStats(stats);
}, [data]);  // Correct dependency
```

---

### ❌ Pitfall 10: Not Cleaning Up Share Links
**DON'T**:
- Create share links indefinitely
- Never check if original study still exists

**DO**:
```typescript
// ✅ Validate share link before displaying
function getShareLink(shareId: string): ShareLink | null {
  const shareLinks = loadShareLinks();
  const shareLink = shareLinks[shareId];
  
  if (!shareLink) return null;
  
  // Check if original study still exists
  const study = loadStudy(shareLink.studyId);
  if (!study) {
    // Study was deleted, remove share link
    deleteShareLink(shareId);
    return null;
  }
  
  return shareLink;
}
```

---

## Benefits of This Architecture

### Separation of Concerns
- Each feature in its own module
- Clear boundaries between features
- Easy to locate and modify code

### Reusability
- Path utilities can be used elsewhere
- Password utilities can be reused
- Share manager can be extended

### Testability
- Isolated functions are easy to unit test
- Components can be tested independently
- Business logic separated from UI

### Maintainability
- Clear file organization
- Self-documenting structure
- Easy to understand data flow

### Scalability
- Easy to add more sharing features
- Easy to add more parent node levels
- Easy to extend calculation logic

---

## Notes and Considerations

### Share Feature Notes
- **No Backend Required**: Uses localStorage, works offline
- **Password Security**: Client-side hashing is acceptable for this use case (not banking-level security)
- **Manual Refresh**: Users click refresh button to check for updates (no automatic polling, saves resources)
- **Expiration**: Can be added later if needed
- **Access Tracking**: Basic tracking (access count, last accessed) for analytics

### Parent Node Feature Notes
- **Path Parsing**: Must handle various formats users might input
- **Performance**: Calculation is O(n) per task, should be fast even with many participants
- **UI Placement**: Filter should be prominent but not intrusive
- **Export Default**: Include all 3 levels by default in export (as requested)

### Future Enhancements
- Share feature: Add expiration dates, access logs, revoke links
- Parent node: Add more levels (4th, 5th), custom level selection
- Both: Add analytics/usage tracking

---

## Questions to Consider

1. **Share Feature**:
   - Should share links expire by default?
   - Should we track who accessed the link?
   - Should we allow revoking share links?

2. **Parent Node Feature**:
   - Should we support more than 3 levels?
   - Should the filter remember user's last selection?
   - Should parent node stats be included in Overview tab?

---

---

## Safety & Backward Compatibility

### Critical Safety Measures

#### 1. **Non-Breaking Data Model Changes**
All new fields are **optional** to ensure backward compatibility:

```typescript
// ✅ SAFE - Optional field
parentNodeStats?: {
  level1: { ... };
  level2?: { ... };  // Also optional since level 2 might not exist
  level3?: { ... };  // Also optional since level 3 might not exist
}

// ❌ UNSAFE - Required field (would break existing data)
parentNodeStats: {
  level1: { ... };
}
```

**Action Items**:
- Ensure `parentNodeStats` has `?` (optional) in TypeScript interface
- Ensure `level2` and `level3` are also optional (`| null`)
- Add null checks before accessing these fields in UI

#### 2. **Separate Storage for Share Feature**
Share links use a **separate localStorage key** (`tree-test-share-links`), completely isolated from:
- Analyzer studies (`tree-test-analyzer-studies`)
- Creator studies (`tree-test-creator-studies`)
- App settings

**Safety guarantees**:
- Share feature cannot modify original study data
- Deleting a share link does not delete the study
- Share links are read-only references

#### 3. **Safe Calculation Strategy**
Parent node calculations are:
- **Non-destructive**: Never modify original data
- **On-demand**: Calculated when stats are computed, not stored permanently
- **Error-tolerant**: Wrapped in try-catch to prevent crashes

```typescript
// Safe calculation pattern
try {
  const parentNodeStats = calculateParentNodeStats(task, data.participants);
  return {
    ...task,
    stats: {
      ...existingStats,
      parentNodeStats: parentNodeStats || undefined  // Falls back to undefined
    }
  };
} catch (error) {
  console.error('Failed to calculate parent node stats:', error);
  // Return task without parent node stats - existing functionality preserved
  return {
    ...task,
    stats: existingStats
  };
}
```

#### 4. **Defensive Path Parsing**
Path utilities must handle all existing formats gracefully:

```typescript
export function parsePath(path: string): string[] {
  try {
    if (!path || typeof path !== 'string') {
      return [];
    }
    
    // Normalize various separators
    const normalized = path
      .replace(/\s*->\s*/g, '|')
      .replace(/\s*>\s*/g, '|')
      .replace(/\s*\/\s*/g, '|');
    
    return normalized
      .split('|')
      .map(node => node.trim())
      .filter(node => node.length > 0);
  } catch (error) {
    console.error('Path parsing error:', error);
    return [];  // Return empty array on error
  }
}
```

#### 5. **UI Safety Measures**

**TasksTab Integration** - Always check for existence:
```typescript
// ✅ SAFE
{showParentNodeView && 
 selectedTask.stats.parentNodeStats && 
 selectedParentLevel && 
 getParentNodeStatsForLevel(selectedTask.stats.parentNodeStats, selectedParentLevel) && (
  <ParentNodeSuccessView ... />
)}

// ❌ UNSAFE - Could crash if parentNodeStats doesn't exist
{showParentNodeView && (
  <ParentNodeSuccessView 
    stats={selectedTask.stats.parentNodeStats.level1}  // Could be undefined!
  />
)}
```

**Export/Markdown Generation** - Graceful degradation:
```typescript
function generateParentNodeSection(task: TaskStats): string {
  // Early return if no parent node stats
  if (!task.stats.parentNodeStats) {
    return ""; // Skip section entirely - no error
  }
  
  // Continue with generation...
}
```

#### 6. **Migration Strategy for Existing Data**

**No migration needed** because:
- Parent node stats are calculated on-the-fly
- No stored data needs updating
- Old studies work exactly as before
- New feature only adds information, never removes or changes existing data

**Testing checklist before deployment**:
1. Load an old study (created before the update) → Should work normally
2. View old study with parent node toggle OFF → Should look identical to before
3. Toggle parent node ON with old study → Should calculate or show "N/A" gracefully
4. Create new study → Should include parent node stats
5. Share an old study → Should work (shared view handles missing parentNodeStats)

#### 7. **Rollback Plan**

If issues arise, the features can be disabled without data loss:

**Disable Parent Node Feature**:
- Comment out the calculation in `calculateTaskStats()`
- Hide UI components (ParentNodeFilter, ParentNodeSuccessView)
- Skip markdown section generation
- No data cleanup needed

**Disable Share Feature**:
- Remove route from App.tsx
- Hide Share button
- Share links remain in localStorage but are inactive
- Can be purged later if needed: `localStorage.removeItem('tree-test-share-links')`

### Pre-Deployment Testing Checklist

- [ ] Create test study in dev environment
- [ ] Load existing study from production backup
- [ ] Verify existing studies display correctly
- [ ] Toggle parent node feature on/off
- [ ] Generate export with and without parent node stats
- [ ] Create share link for old study
- [ ] Create share link for new study
- [ ] Test password-protected share
- [ ] Test refresh on shared view
- [ ] Verify localStorage keys are separate
- [ ] Test with malformed path formats
- [ ] Test with studies that have no tree structure
- [ ] Test with studies that have only 1-level paths

### Deployment Steps

1. **Deploy to staging/preview first**
   - Test with real data backups
   - Verify no console errors
   - Check localStorage structure

2. **Deploy to production**
   - Deploy during low-traffic time
   - Monitor console for errors
   - Keep previous version ready for quick rollback

3. **Post-deployment monitoring**
   - Check for error reports
   - Verify share links work across sessions
   - Test parent node calculations on various studies

---

## Conclusion

This plan provides a comprehensive roadmap for implementing both features with clean architecture, separation of concerns, and maintainable code structure. The modular approach ensures that each feature can be developed, tested, and maintained independently while integrating seamlessly with the existing codebase.

**Safety is prioritized through**:
- Optional fields (backward compatible)
- Separate storage (no data conflicts)
- On-demand calculations (no permanent changes)
- Defensive programming (graceful error handling)
- Easy rollback (features can be disabled independently)

---

## Quick Reference: Safety Checklist

### Before Writing Code
- [ ] Understand which data structures will change
- [ ] Ensure all new fields are optional (`?` in TypeScript)
- [ ] Plan separate storage keys for new features
- [ ] Review existing code to understand data flow

### During Development
- [ ] Use optional chaining (`?.`) for all new field access
- [ ] Wrap calculations in try-catch blocks
- [ ] Return safe defaults on errors (empty arrays, 0, null)
- [ ] Test with console.log before adding UI
- [ ] Check existing studies still work after each step

### Parent Node Feature Specifics
- [ ] `parentNodeStats` is optional in `TaskStats`
- [ ] `level2` and `level3` can be null
- [ ] Path parsing returns empty array on error
- [ ] UI checks for existence before rendering
- [ ] Markdown export skips section if no data
- [ ] Calculation doesn't modify original data

### Share Feature Specifics
- [ ] Use separate localStorage key: `tree-test-share-links`
- [ ] Never modify original study data
- [ ] Validate share links before displaying
- [ ] Check if original study exists
- [ ] Password hashing is async (use `await`)
- [ ] Read-only view - no edit actions

### Testing Before Deployment
- [ ] Test with study created before the update
- [ ] Test with newly created study
- [ ] Test with malformed/edge case data
- [ ] Test parent node toggle on/off
- [ ] Test share with/without password
- [ ] Test refresh on shared view
- [ ] Check localStorage keys are correct
- [ ] Verify no console errors
- [ ] Export report and verify format
- [ ] Test in incognito mode (fresh state)

### After Deployment
- [ ] Monitor console for errors
- [ ] Test share links across sessions
- [ ] Verify parent node calculations are accurate
- [ ] Check localStorage size hasn't exploded
- [ ] Get user feedback
- [ ] Be ready to disable features if needed

### Emergency Rollback
If something breaks:

**Disable Parent Node Feature**:
```typescript
// In lib/stats.ts - comment out the calculation
// const parentNodeStats = calculateParentNodeStats(task, data.participants);
const parentNodeStats = undefined;  // Temporarily disable

// In TasksTab.tsx - hide the UI
const ENABLE_PARENT_NODE = false;  // Feature flag
{ENABLE_PARENT_NODE && <ParentNodeFilter ... />}
```

**Disable Share Feature**:
```typescript
// In App.tsx - comment out the route
// <Route path="/share/:shareId" element={<SharedAnalyzer />} />

// In DashboardLayout.tsx - hide the button
const ENABLE_SHARE = false;  // Feature flag
{ENABLE_SHARE && <ShareButton ... />}
```

### Key Files to Watch
**Parent Node Feature**:
- `lib/stats/path-utils.ts` - Path parsing (most likely to have edge cases)
- `lib/stats.ts` - Integration point (could affect performance)
- `components/dashboard/TasksTab.tsx` - UI integration (could have rendering issues)

**Share Feature**:
- `lib/sharing/share-manager.ts` - Data management (localStorage operations)
- `pages/SharedAnalyzer.tsx` - Routing (could have 404 issues)
- `App.tsx` - Route configuration (syntax errors break routing)

### Performance Considerations
- Parent node calculations add ~O(n*m) where n=participants, m=tasks
- Should be negligible for typical study sizes (< 100 participants, < 20 tasks)
- If performance issues arise, consider memoization:
  ```typescript
  const parentNodeStats = useMemo(() => 
    calculateParentNodeStats(task, participants),
    [task, participants]
  );
  ```

### localStorage Limits
- Browser limit: ~5-10MB per domain
- Current usage: Small (JSON data is compressed)
- Share links add minimal overhead (~1KB per link)
- Monitor if users create many share links (>100)
- Add cleanup function if needed (delete old share links)

---

## Summary

This implementation plan is designed to be:
1. **Safe**: No breaking changes, all fields optional, defensive coding
2. **Incremental**: Build in small testable steps
3. **Reversible**: Features can be disabled without data loss
4. **Well-documented**: Clear examples and explanations
5. **Production-ready**: Tested with real data before deployment

The features are independent and can be deployed separately. Parent Node is simpler and should be deployed first. Share Feature is more complex but uses separate storage so has no impact on existing studies.

**Estimated Implementation Time**:
- Parent Node Feature: 4-6 hours
- Share Feature: 6-8 hours
- Testing & Bug Fixes: 2-4 hours
- **Total**: 12-18 hours (1.5 to 2.5 days)

