# 🔧 Life Dimensions Goal Tracker - Technical Documentation

## 📐 Architecture Overview

The Life Dimensions Goal Tracker is built as a React application using TypeScript, with a component-based architecture leveraging modern React patterns. The application uses local state management via React hooks, with a focus on simplicity and maintainability.

### 🗂️ Project Structure

```
├── src/
│   ├── components/
│   │   ├── Grid.tsx          # Main visualization grid
│   │   ├── Sidebar.tsx       # Milestone creation/editing sidebar
│   │   └── GoalModal.tsx     # Annual goal creation modal
│   ├── types.ts              # TypeScript type definitions
│   ├── App.tsx               # Main application component
│   ├── main.tsx              # Application entry point
│   └── index.css             # Global styles
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies and scripts
```

## 💾 Data Models

The application uses several key data structures defined in `types.ts`:

```typescript
// Six life dimensions
export type Dimension = 'family' | 'health' | 'wealth' | 'self-realization' | 'friends' | 'leisure';

// Annual goals for each dimension
export interface Goal {
  id: string;
  dimension: Dimension;
  description: string;
  completed: boolean;
}

// Monthly milestone achievements
export interface Milestone {
  id: string;
  dimension: Dimension;
  month: number;         // 1-12 representing Jan-Dec
  description: string;
  completed: boolean;
  futureTense: string;   // Description in future tense
  pastTense: string;     // Description in past tense
}

// Visual configuration for each dimension
export interface DimensionConfig {
  name: Dimension;
  color: string;
  icon: string;
  description: string;
}
```

## 🧩 Component Breakdown

### 📱 App Component (`App.tsx`)

The App component serves as the central controller for the application:

- **State Management**:
  - `milestones`: Array of all milestone objects
  - `goals`: Array of annual goal objects
  - UI state for sidebar and modal visibility
  - Selected dimension and month tracking

- **Key Functions**:
  - `handleAddMilestone`: Adds a new milestone to the state
  - `handleMilestoneClick`: Toggles milestone completion status
  - `handleMilestoneEdit`: Prepares the sidebar for editing a milestone
  - `handleMilestoneDelete`: Removes a milestone from state
  - `handleGoalToggle`: Toggles goal completion status
  - `calculateProgress`: Computes overall completion percentage

### 📊 Grid Component (`Grid.tsx`)

The Grid component visualizes the 6×12 matrix of dimensions and months:

- **Props**:
  - `milestones`: Array of all milestones
  - `goals`: Array of annual goals
  - Event handlers for milestone and goal interactions

- **Key Features**:
  - Renders the dimension rows and month columns
  - Displays color-coded cells based on dimensions
  - Shows milestone cards within each cell
  - Provides hover interactions for editing/adding/deleting
  - Renders annual goals in the rightmost column

- **Helper Functions**:
  - `getMilestones`: Filters milestones by dimension and month
  - `getDimensionGoals`: Retrieves goals for a specific dimension

### 📝 Sidebar Component (`Sidebar.tsx`)

The Sidebar component handles milestone creation and editing:

- **Props**:
  - `onAddMilestone`: Callback to add a new milestone
  - `dimension`: Currently selected dimension
  - `month`: Currently selected month
  - `milestones`: All existing milestones
  - `isOpen`: Visibility state
  - `onClose`: Callback to close the sidebar

- **State**:
  - `description`: Text input for the milestone description

- **Key Features**:
  - Conditionally renders either milestone creation form or dimension/month selection
  - Shows existing milestones for the selected cell
  - Validates input before submission

### 🏆 GoalModal Component (`GoalModal.tsx`)

The GoalModal component provides a focused interface for creating annual goals:

- **Props**:
  - `dimension`: The dimension for which a goal is being added
  - `isOpen`: Visibility state
  - `onClose`: Callback to close the modal
  - `onSubmit`: Callback to submit the new goal

- **State**:
  - `description`: Text input for the goal description

## 🔄 Data Flow

1. **User initiates an action** (clicks on a cell, milestone, or goal)
2. **Component handler is triggered** (e.g., `handleAddNewMilestone`)
3. **State is updated** in the App component
4. **UI updates** reflect the changed state
5. **Components re-render** with new props

## 🧪 Potential Enhancements

1. **Persistent Storage**:
   - Implement local storage or a backend API to save user data
   - Add user authentication for personalized dashboards

2. **Advanced Visualization**:
   - Add progress charts and graphs
   - Implement a timeline view option

3. **Notifications**:
   - Add reminder functionality for upcoming milestones
   - Implement celebratory notifications for completed milestones

4. **Mobile Optimizations**:
   - Add swipe gestures for grid navigation
   - Optimize touch interactions for smaller screens

5. **Data Export/Import**:
   - Allow users to export their data as JSON or CSV
   - Support importing data from external sources

## 🛠️ Implementation Notes

### State Management Approach

The application uses React's built-in `useState` hook for state management. For larger implementations, consider:

- **Context API**: For deeper component trees
- **Redux**: For more complex state requirements
- **Zustand**: For a simpler global state alternative

### Performance Considerations

- Cell rendering is optimized to only re-render when related data changes
- Hover states are managed efficiently to avoid unnecessary re-renders
- Consider implementing virtualization for larger datasets

### Accessibility Features

- Color contrast meets WCAG 2.1 AA standards
- Interactive elements have appropriate focus states
- Semantic HTML structure enhances screen reader compatibility 