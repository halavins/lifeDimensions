# 👩‍💻 Life Dimensions Goal Tracker - Developer Guide

## 🚀 Quick Start

```bash
# Clone the repository
git clone [repository-url]

# Navigate to project directory
cd life-dimensions

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🏗️ Project Architecture

This application is built with:
- **React** + **TypeScript** for the core application
- **Tailwind CSS** for styling
- **Vite** for build tooling and development server

### 📂 Folder Structure

```
├── src/                  # Source code
│   ├── components/       # React components
│   │   ├── Grid.tsx      # Main grid visualization
│   │   ├── Sidebar.tsx   # Milestone creation/editing
│   │   └── GoalModal.tsx # Goal creation modal
│   ├── types.ts          # TypeScript types
│   ├── App.tsx           # Main application component
│   └── main.tsx          # Entry point
└── public/               # Static assets
```

## 🧩 Core Components

### 1. Grid Component (`Grid.tsx`)

The main visualization component displaying the 6×12 grid. Takes the following props:

```typescript
interface GridProps {
  milestones: Milestone[];                              // All milestones
  goals: Goal[];                                        // All annual goals
  onMilestoneClick: (milestone: Milestone) => void;     // Toggle completion
  onMilestoneEdit: (milestone: Milestone) => void;      // Edit milestone
  onMilestoneDelete: (milestone: Milestone) => void;    // Delete milestone
  onAddMilestone: (dimension: Dimension, month: number) => void; // Add milestone
  onGoalToggle: (goal: Goal) => void;                   // Toggle goal status
  onGoalAdd: (dimension: Dimension) => void;            // Add annual goal
  onGoalDelete: (goal: Goal) => void;                   // Delete annual goal
}
```

### 2. Sidebar Component (`Sidebar.tsx`)

Handles milestone creation and editing:

```typescript
interface SidebarProps {
  onAddMilestone: (milestone: Omit<Milestone, 'id'>) => void; // Add milestone
  dimension: Dimension | null;                          // Selected dimension
  month: number | null;                                 // Selected month
  milestones: Milestone[];                              // All milestones
  isOpen: boolean;                                      // Visibility state
  onClose: () => void;                                  // Close handler
}
```

### 3. GoalModal Component (`GoalModal.tsx`)

Modal for creating annual goals:

```typescript
interface GoalModalProps {
  dimension: Dimension;                                 // Selected dimension
  isOpen: boolean;                                      // Visibility state
  onClose: () => void;                                  // Close handler
  onSubmit: (description: string) => void;              // Submit handler
}
```

## 🧠 State Management

The application uses React's built-in `useState` hooks for state management, with all state centralized in the `App.tsx` component. Key state objects:

1. **Milestones**: Stores all user milestones
   ```typescript
   const [milestones, setMilestones] = useState<Milestone[]>([]);
   ```

2. **Goals**: Stores annual goals for each dimension
   ```typescript
   const [goals, setGoals] = useState<Goal[]>([]);
   ```

3. **UI State**: Controls modals, sidebars, and selections
   ```typescript
   const [sidebarOpen, setSidebarOpen] = useState(false);
   const [goalModalOpen, setGoalModalOpen] = useState(false);
   const [selectedDimension, setSelectedDimension] = useState<Dimension | null>(null);
   const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
   ```

## 🛠️ Common Development Tasks

### Adding a New Feature

1. **Identify component**: Determine which component needs modification
2. **Update state**: Add any required state variables to App.tsx
3. **Add event handlers**: Create any necessary event handlers
4. **Implement UI**: Add UI elements to appropriate component(s)
5. **Connect handlers**: Wire up event handlers to UI elements

### Adding a New Dimension

1. Open `src/types.ts` and update the `Dimension` type:
   ```typescript
   export type Dimension = 'family' | 'health' | ... | 'your-new-dimension';
   ```

2. Update the color mapping in `Grid.tsx`:
   ```typescript
   const dimensionColors: Record<Dimension, string> = {
     // ... existing dimensions
     'your-new-dimension': 'bg-indigo-100 hover:bg-indigo-200',
   };
   ```

3. Update the dimensions array in `Grid.tsx`:
   ```typescript
   const dimensions: Dimension[] = ['family', 'health', ... , 'your-new-dimension'];
   ```

### Modifying the UI

The application uses Tailwind CSS for styling. To modify styles:

1. Find the component you want to modify
2. Update the className strings with appropriate Tailwind classes
3. For complex styling, consider extracting to custom Tailwind components

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## 📦 Building for Production

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vite Documentation](https://vitejs.dev/guide) 