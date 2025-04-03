# 📊 Life Dimensions - Data Import Instructions

Follow these simple steps to import your milestone and goal data from the CSV file into the Life Dimensions application.

## 🚀 Quick Start Method

1. Start the application with `npm run dev`
2. Open your browser to the application (usually http://localhost:5173)
3. Open your browser's developer console:
   - **Windows/Linux**: Press `F12` or `Ctrl+Shift+J`
   - **macOS**: Press `Command+Option+J`
4. Copy the entire content of the `populate-data-simple.js` file
5. Paste it into the console and press Enter
6. You'll see a confirmation dialog asking if you want to automatically import all data
7. Click "OK" to begin the automatic import process
   - **Important**: Do not interact with the page during the import process
   - The script will add each milestone and goal one by one, simulating user interaction
   - This may take a few minutes to complete

## 🛠️ Manual Import Methods

If the automatic import doesn't work properly, you can use these alternative methods:

### Using Helper Functions

After running the script, several helper functions are available in the console:

1. **Add a single milestone**:
   ```javascript
   addMilestone('dimension', month, 'description');
   ```
   Example:
   ```javascript
   addMilestone('health', 4, 'Find dentist in Florida');
   ```

2. **Add a single goal**:
   ```javascript
   addGoal('dimension', 'description');
   ```
   Example:
   ```javascript
   addGoal('health', 'No pain in the teeth');
   ```

3. **Access all parsed data**:
   ```javascript
   console.log(dimensionData);
   ```

### Direct UI Interaction

You can also manually add items using the UI:

1. **Adding Milestones**:
   - Click the + button in the bottom right corner
   - Select the dimension and month
   - Enter the milestone description
   - Click the Add button

2. **Adding Goals**:
   - Find the "Add Goal" button in the right column for each dimension
   - Click it and enter the goal description
   - Click the Add Goal button

## 🔍 Troubleshooting

If you encounter issues with the automatic import:

1. **Selector Errors**: The script relies on finding specific elements in the DOM. If the application structure changes, the selectors might fail. Try using the manual methods instead.

2. **Timing Issues**: The script uses setTimeout to wait for UI elements to appear. If operations happen too quickly or slowly, adjust the timeout values in the script.

3. **Browser Compatibility**: This script works best in Chrome or Edge. Other browsers might have compatibility issues with some DOM operations.

4. **Console Errors**: Check the console for any error messages that might help identify the problem.

## 📝 CSV Format Reference

The script expects CSV data in the following format:

```
,Dimension,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec,Jan,Feb,Mar,Goals 
Label,Family,milestone1,milestone2,...,goal1
,,additional text,,,,,,,,,,,goal2
```

Where:
- First row contains headers
- Columns 3-14 represent months (Apr-Mar)
- Last column contains goals
- Dimension names should match exactly: 'family', 'health', 'wealth', 'self-realization', 'friends', 'leisure'
- Each row with a non-empty Dimension starts a new dimension section 