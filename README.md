# 🎯 Life Dimensions Goal Tracker

A minimalist dashboard that visualizes your one-year transformation journey across 6 life dimensions using an interactive 6×12 grid system (dimensions × months) with intuitive milestone planning and progress tracking.

## 📋 Features

- **Interactive Grid Visualization:** Color-coded life dimensions (family, health, wealth, self-realization, friends, leisure) with drag-and-drop milestone cards
- **Multiple Milestone Support:** Up to 3 milestones per month for each dimension
- **Future-Focused Goals:** Write achievements in past tense as if already accomplished for positive visualization
- **Progress Tracking:** Visual indicators showing completion percentages for overall and monthly progress
- **Simple Interface:** Adding a milestone requires just tapping on any cell and filling a short form
- **Annual Goals:** Track your yearly objectives alongside monthly milestones

## 🧩 Application Structure

### Core Components

1. **Grid Component (`Grid.tsx`):**
   - Main visualization showing the 6×12 grid (dimensions × months)
   - Displays milestones as cards within each cell
   - Manages interactions (add, edit, delete, complete milestones)
   - Shows dimension-specific goals in the rightmost column

2. **Sidebar Component (`Sidebar.tsx`):**
   - Handles adding and editing milestones
   - Displays existing milestones for a selected cell
   - Allows selection of dimension and month

3. **GoalModal Component (`GoalModal.tsx`):**
   - Modal for adding annual goals for each dimension

### Data Models

Defined in `types.ts`:

- **Dimension:** Six life areas ('family', 'health', 'wealth', 'self-realization', 'friends', 'leisure')
- **Milestone:** Achievements tied to specific dimensions and months
- **Goal:** Annual objectives for each dimension
- **DimensionConfig:** Visual configuration for each dimension (colors, icons)

## 🛠️ Technical Implementation

### State Management

- React's `useState` hooks manage the application state
- Core state objects:
  - `milestones[]`: Array of all milestones across dimensions and months
  - `goals[]`: Array of annual goals for each dimension
  - UI state for modals and sidebars

### User Interactions

1. **Adding Milestones:**
   - Click on a grid cell to open the sidebar
   - Enter milestone description in past tense
   - Milestone is added to the selected cell

2. **Completing Milestones:**
   - Click on a milestone to toggle completion status
   - Visual checkmarks indicate completed items

3. **Managing Goals:**
   - Add annual goals via the "Add Goal" button in each dimension row
   - Toggle goal completion status
   - Delete goals when no longer relevant

### Progress Calculation

Overall progress is calculated by determining the percentage of completed milestones across all dimensions and months.

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Open your browser to the local development URL

## 📱 Responsive Design

The application is designed to work seamlessly on both desktop and mobile browsers:
- Responsive grid layout with horizontal scrolling for smaller screens
- Touch-friendly interface for milestone management
- Optimized modals and sidebars for mobile interaction

## 🧠 Development Philosophy

This application embraces the power of visualization and future-focused goal setting. By writing milestones in the past tense as if already accomplished, users tap into powerful psychological principles that make goal achievement more likely. 