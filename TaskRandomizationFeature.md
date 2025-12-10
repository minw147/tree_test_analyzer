# Task Randomization Implementation - Plain English Explanation

## Overview

Task randomization shuffles the task order for each participant to reduce order bias. Each participant sees tasks in a random order, but results are mapped back to the original task IDs for analysis.

---

## How It Works

### 1. Configuration (Study Settings)

**File:** `src/components/creator/TaskEditor.tsx` (lines 233-250)

**What happens:**
- Toggle in the Creator: "Randomize task order for each participant"
- Setting stored in `study.settings.randomizeTasks` (boolean)
- Only shown when there are 2+ tasks (no point randomizing 1 task)

**Code:**
```typescript
const randomizeTasks = settings?.randomizeTasks === true;

// Toggle switch
<Switch
    id="randomize-tasks"
    checked={randomizeTasks}
    onChange={handleRandomizeToggle}
/>
```

---

### 2. Shuffling Algorithm

**File:** `src/lib/utils/task-randomizer.ts`

**Algorithm:** Fisher-Yates shuffle

**What it does:**
- Creates a copy of the tasks array (doesn't modify original)
- Shuffles the copy using Fisher-Yates
- Preserves all task properties (id, description, correctPath, etc.)
- Returns tasks in random order

**Code:**
```typescript
export function shuffleTasks<T extends { id: string }>(tasks: T[]): T[] {
    const shuffled = [...tasks]; // Copy array
    
    // Fisher-Yates shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap
    }
    
    return shuffled;
}
```

**Why Fisher-Yates:**
- True randomization (each permutation equally likely)
- Efficient (O(n) time)
- Industry standard

---

### 3. Initialization (When Participant Starts)

**File:** `src/pages/ParticipantView.tsx` (lines 39-60)

**What happens:**
- When study loads, checks if randomization is enabled
- If enabled AND there are 2+ tasks, shuffles the tasks
- Creates mapping tables to track original vs shuffled positions

**Code:**
```typescript
const initializeShuffledTasks = (study: StudyConfig) => {
    if (study.settings.randomizeTasks === true && study.tasks.length > 1) {
        const shuffled = shuffleTasks(study.tasks);
        setShuffledTasks(shuffled);
        
        // Create mapping: taskId → shuffled index
        const idToIndex = new Map<string, number>();
        const indexToId = new Map<number, string>();
        shuffled.forEach((task, index) => {
            idToIndex.set(task.id, index);
            indexToId.set(index, task.id);
        });
        shuffledTaskIdToIndex.current = idToIndex;
        shuffledIndexToTaskId.current = indexToId;
    } else {
        // No randomization
        setShuffledTasks(null);
    }
};
```

**Mappings created:**
- `shuffledTaskIdToIndex`: Maps task ID → position in shuffled array
- `shuffledIndexToTaskId`: Maps shuffled position → task ID

**Example:**
- Original: `[Task1, Task2, Task3]` (IDs: `task-1`, `task-2`, `task-3`)
- Shuffled: `[Task3, Task1, Task2]` (IDs: `task-3`, `task-1`, `task-2`)
- Mapping: `task-3` → index 0, `task-1` → index 1, `task-2` → index 2

---

### 4. Display (Participant Sees Shuffled Order)

**File:** `src/components/participant/ParticipantPreview.tsx` (line 55)

**What happens:**
- Component receives `shuffledTasks` prop (or uses original if not shuffled)
- Displays tasks in shuffled order
- Participant sees "Task 1", "Task 2", etc. in the shuffled sequence

**Code:**
```typescript
// Use shuffled tasks if provided, otherwise use original tasks
const tasksToUse = shuffledTasks || study.tasks;

const currentTask = tasksToUse[currentTaskIndex]; // Shows shuffled order
```

**User experience:**
- Participant sees tasks in random order
- Progress shows "Task 1 of 3", "Task 2 of 3", etc. (based on shuffled position)
- Each participant gets a different order

---

### 5. Result Mapping (Back to Original Tasks)

**File:** `src/pages/ParticipantView.tsx` (lines 425-437)

**What happens:**
- When submitting results, maps back to original task IDs
- Uses `taskId` (not index) to identify which task was completed
- Results stored with original task IDs for analysis

**Code:**
```typescript
// Build task results - always iterate over ORIGINAL tasks in original order
const taskResults: TaskResult[] = state.study.tasks.map((task) => {
    // Find result by taskId (handles both randomized and non-randomized cases)
    const taskResult = allTaskResults.find(tr => tr.taskId === task.id);
    
    // Get the shuffled index for this task (if randomized) or original index
    const shuffledIndex = shuffledTaskIdToIndex.current.get(task.id);
    const displayIndex = shuffledIndex !== undefined 
        ? shuffledIndex 
        : (state.study?.tasks.findIndex(t => t.id === task.id) ?? -1);
    
    // Use displayIndex to get timing/path data
    const taskStartTime = taskStartTimes.current.get(displayIndex);
    const pathTaken = taskPaths.current.get(displayIndex) || [];
    
    // Return result with original task ID
    return {
        taskId: task.id, // Original task ID (not shuffled index)
        // ... other data
    };
});
```

**Why this matters:**
- Results always use original task IDs
- Analysis groups results by original task
- Randomization is transparent to analysis

---

## Data Flow Diagram

```
1. Study Created
   └── Creator sets: randomizeTasks = true
   
2. Participant Visits Link
   └── ParticipantView loads study config
   └── initializeShuffledTasks() called
   └── If enabled: shuffleTasks() creates random order
   └── Mappings created: taskId ↔ shuffled index
   
3. Participant Takes Test
   └── Sees tasks in shuffled order (Task 1, 2, 3...)
   └── Clicks tracked by shuffled index (0, 1, 2...)
   └── Results stored with taskId (original ID)
   
4. Results Submitted
   └── Map results back to original task IDs
   └── Store with original task structure
   └── Analysis uses original task IDs
```

---

## Key Design Decisions

### 1. Task ID-based mapping
- Uses `taskId` (not index) to identify tasks
- Works with or without randomization
- Original task IDs preserved in results

### 2. Shuffled index for tracking
- Uses shuffled index for UI display and progress
- Uses shuffled index for tracking clicks/paths during test
- Maps back to original task ID when saving

### 3. Per-participant randomization
- Each participant gets a different random order
- Shuffled when study loads (not pre-shuffled)
- Each session is independent

### 4. Preserves original structure
- Original tasks array never modified
- Shuffled copy created only for display
- Results always reference original task IDs

---

## Files Involved

| File | Purpose |
|------|---------|
| `src/lib/utils/task-randomizer.ts` | Core shuffling algorithm |
| `src/components/creator/TaskEditor.tsx` | UI toggle for enabling randomization |
| `src/pages/ParticipantView.tsx` | Initializes shuffling, maps results back |
| `src/components/participant/ParticipantPreview.tsx` | Displays tasks in shuffled order |
| `src/lib/types/study.ts` | Type definition: `randomizeTasks?: boolean` |

---

## Testing

**File:** `src/lib/utils/task-randomizer.test.ts`

**Test coverage:**
- ✅ Doesn't mutate original array
- ✅ Preserves all task IDs
- ✅ Handles edge cases (empty, single task)
- ✅ Produces different orders on multiple calls
- ✅ Preserves task properties

---

## Example Scenario

**Original Tasks:**
1. Task A (id: `task-a`)
2. Task B (id: `task-b`)
3. Task C (id: `task-c`)

**Participant 1 (Randomized):**
- Sees: Task B → Task C → Task A
- Shuffled indices: 0, 1, 2
- Results stored: `{taskId: 'task-b'}, {taskId: 'task-c'}, {taskId: 'task-a'}`

**Participant 2 (Randomized):**
- Sees: Task C → Task A → Task B
- Shuffled indices: 0, 1, 2
- Results stored: `{taskId: 'task-c'}, {taskId: 'task-a'}, {taskId: 'task-b'}`

**Analysis:**
- All results for Task A grouped together (regardless of when participant saw it)
- All results for Task B grouped together
- All results for Task C grouped together

---

## Summary

- Configuration: Toggle in Creator saves `randomizeTasks` setting
- Shuffling: Fisher-Yates algorithm creates random order per participant
- Display: Participant sees shuffled order, but progress uses shuffled indices
- Mapping: Results mapped back to original task IDs using `taskId`
- Analysis: Results grouped by original task IDs (randomization transparent)

This design ensures randomization reduces order bias while keeping analysis consistent with the original task structure.