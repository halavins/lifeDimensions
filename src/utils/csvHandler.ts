import type { Milestone, Goal, Dimension } from '../types';

// Dimensions array to validate against
const DIMENSIONS: Dimension[] = ['family', 'health', 'wealth', 'self-realization', 'friends', 'leisure'];

interface AppData {
  milestones: Milestone[];
  goals: Goal[];
}

// Types for the milestone data structure
interface MilestonesByDimension {
  [dimension: string]: {
    [month: number]: string[];
  };
}

interface GoalsByDimension {
  [dimension: string]: string[];
}

interface DimensionCompletionStatus {
  [dimension: string]: {
    milestones: {
      [month: number]: boolean[];
    };
    goals: boolean[];
  };
}

interface MilestoneData {
  milestonesByDimension: MilestonesByDimension;
  goalsByDimension: GoalsByDimension;
  dimensionCompletionStatus: DimensionCompletionStatus;
}

/**
 * Convert a month number (1-12) to the corresponding month name
 */
function getMonthName(month: number): string {
  // Convert month number to name (Apr=4, May=5, ..., Dec=12, Jan=1, Feb=2, Mar=3)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Adjust for our custom calendar that starts with April as month 4
  // Jan=1, Feb=2, Mar=3, Apr=4, May=5, etc.
  let index = month - 1;
  
  // Ensure index is within bounds
  if (index < 0 || index >= 12) {
    index = 0;
  }
  
  return monthNames[index];
}

/**
 * Convert a month name to the corresponding month number (1-12)
 */
function getMonthNumber(monthName: string): number {
  const monthMap: Record<string, number> = {
    'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
    'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
  };
  return monthMap[monthName] || 1;
}

/**
 * Parse a CSV line respecting quoted fields exactly like Excel does.
 * Commas inside quoted fields will be preserved as part of the field.
 */
function parseCSVLine(line: string): string[] {
  // Results array
  const result: string[] = [];
  
  // Current position in the line
  let pos = 0;
  
  // Length of the line
  const len = line.length;
  
  // Process until we reach the end of the line
  while (pos < len) {
    // Skip leading whitespace
    while (pos < len && (line[pos] === ' ' || line[pos] === '\t')) {
      pos++;
    }
    
    // Initialize field value
    let value = '';
    
    // Check if this is a quoted field
    if (pos < len && line[pos] === '"') {
      // Move past the opening quote
      pos++;
      
      // Read until closing quote
      while (pos < len) {
        // Check for doubled quotes (escaped quotes)
        if (line[pos] === '"' && pos + 1 < len && line[pos + 1] === '"') {
          // Add a single quote and skip the second quote
          value += '"';
          pos += 2;
        } 
        // Check for closing quote
        else if (line[pos] === '"') {
          // Move past the closing quote
          pos++;
          break;
        } 
        // Regular character
        else {
          value += line[pos];
          pos++;
        }
      }
      
      // Skip any trailing whitespace after quoted field
      while (pos < len && (line[pos] === ' ' || line[pos] === '\t')) {
        pos++;
      }
      
      // Move past the delimiter (comma)
      if (pos < len && line[pos] === ',') {
        pos++;
      }
    } 
    // Unquoted field
    else {
      // Read until comma or end of line
      while (pos < len && line[pos] !== ',') {
        value += line[pos];
        pos++;
      }
      
      // Trim the value for unquoted fields
      value = value.trim();
      
      // Move past the delimiter (comma)
      if (pos < len && line[pos] === ',') {
        pos++;
      }
    }
    
    // Add the field to the result
    result.push(value);
  }
  
  return result;
}

/**
 * Import data from the CSV file
 */
export async function importFromCSV(): Promise<MilestoneData | null> {
  try {
    console.log("Fetching CSV file...");
    const csvText = await fetchCSVFile();
    if (!csvText) {
      throw new Error('No CSV data found');
    }

    console.log("CSV text loaded, parsing...");
    // Split into lines and filter out empty lines
    const lines = csvText.split('\n').filter(line => line.trim().length > 0);
    
    // Parse the headers
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine);
    console.log("CSV headers:", headers);
    
    // Extract month headers (skipping the first two columns: empty and 'Dimension')
    const monthHeaders = headers.slice(2, 14); // 12 months
    console.log("Month headers:", monthHeaders);
    
    // Initialize the data structure
    const milestonesByDimension: MilestonesByDimension = {};
    const goalsByDimension: GoalsByDimension = {};
    const dimensionCompletionStatus: DimensionCompletionStatus = {};
    
    // Current dimension being processed
    let currentDimension: Dimension | null = null;
    
    // Process each line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const cells = parseCSVLine(line);
      
      // Check if this is a new dimension line
      const potentialDimension = cells[1].trim();
      if (potentialDimension) {
        // Convert to lowercase for case-insensitive comparison
        const normalizedDimension = potentialDimension.toLowerCase();
        if (DIMENSIONS.includes(normalizedDimension as Dimension)) {
          currentDimension = normalizedDimension as Dimension;
          console.log(`Processing dimension: ${currentDimension}`);
          
          // Initialize dimension data
          milestonesByDimension[currentDimension] = {};
          goalsByDimension[currentDimension] = [];
          dimensionCompletionStatus[currentDimension] = {
            milestones: {
              1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [], 10: [], 11: [], 12: []
            },
            goals: []
          };
          
          // Initialize month arrays
          monthHeaders.forEach((_, idx) => {
            const monthNum = getMonthNumber(monthHeaders[idx]);
            milestonesByDimension[currentDimension!][monthNum] = [];
          });
        }
      }
      
      // If we have a valid dimension, process the milestones and goals
      if (currentDimension) {
        // Process milestones (columns 2-13, which are indices 2-13)
        monthHeaders.forEach((_, idx) => {
          const monthNum = getMonthNumber(monthHeaders[idx]);
          let milestone = cells[idx + 2]?.trim() || '';
          
          if (milestone) {
            // Check if the milestone is marked as completed
            const isCompleted = milestone.endsWith('(Completed)') || 
                                milestone.endsWith('(completed)');
            
            // Remove the completion marker if present
            if (isCompleted) {
              milestone = milestone.replace(/\s*\((?:C|c)ompleted\)\s*$/, '').trim();
            }
            
            // Add to the milestones array
            milestonesByDimension[currentDimension!][monthNum].push(milestone);
            
            // Set completion status
            dimensionCompletionStatus[currentDimension!].milestones[monthNum].push(isCompleted);
          }
        });
        
        // Process goal (last column)
        let goal = cells[14]?.trim() || '';
        if (goal) {
          // Check if the goal is marked as completed
          const isCompleted = goal.endsWith('(Completed)') || 
                             goal.endsWith('(completed)');
          
          // Remove the completion marker if present
          if (isCompleted) {
            goal = goal.replace(/\s*\((?:C|c)ompleted\)\s*$/, '').trim();
          }
          
          // Add to the goals array
          goalsByDimension[currentDimension].push(goal);
          
          // Set completion status
          dimensionCompletionStatus[currentDimension].goals.push(isCompleted);
        }
      }
    }
    
    // If there's no data, return null
    if (Object.keys(milestonesByDimension).length === 0) {
      console.log("No milestone data found");
      return null;
    }
    
    // Create and return the data object
    const result: MilestoneData = {
      milestonesByDimension,
      goalsByDimension,
      dimensionCompletionStatus
    };
    
    console.log("Successfully parsed CSV data:", {
      dimensions: Object.keys(milestonesByDimension),
      goalDimensions: Object.keys(goalsByDimension),
      statusDimensions: Object.keys(dimensionCompletionStatus)
    });
    
    // Additional debug logging
    console.log('--- Sample of parsed milestone data ---');
    // Log a sample of the parsed data for each dimension
    Object.entries(milestonesByDimension).forEach(([dimension, monthData]) => {
      console.log(`Dimension: ${dimension}`);
      // Show a sample from each month that has data
      Object.entries(monthData).forEach(([month, milestones]) => {
        if (milestones.length > 0) {
          console.log(`  Month ${month}: ${milestones.length} milestones`);
          console.log(`    Sample: "${milestones[0]}"`);
        }
      });
    });
    
    return result;
  } catch (error) {
    console.error('Error importing from CSV:', error);
    return null;
  }
}

/**
 * Format a field for CSV export, following Excel's CSV formatting rules
 * - Fields containing commas, quotes, or newlines are enclosed in quotes
 * - Quotes within fields are doubled
 */
function formatCSVField(value: string): string {
  // Convert to string if not already
  const strValue = String(value).trim();
  
  // If empty, return empty string
  if (!strValue) {
    return '';
  }
  
  // If the field contains commas, quotes, or newlines, or starts/ends with space,
  // it needs to be quoted
  if (
    strValue.includes(',') || 
    strValue.includes('"') || 
    strValue.includes('\n') ||
    strValue.includes('\r') ||
    strValue.startsWith(' ') ||
    strValue.endsWith(' ')
  ) {
    // Escape quotes by doubling them
    const escaped = strValue.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  
  return strValue;
}

/**
 * Export data to the CSV file
 */
export async function exportToCSV(data: AppData): Promise<boolean> {
  try {
    const { milestones, goals } = data;
    
    // Group milestones by dimension and month
    // For each dimension and month, we can have multiple milestones
    const milestonesByDimension: MilestonesByDimension = {};
    const goalsByDimension: GoalsByDimension = {};
    const dimensionCompletionStatus: DimensionCompletionStatus = {};
    
    // Initialize structures for all dimensions
    DIMENSIONS.forEach(dimension => {
      // Initialize milestone structure
      milestonesByDimension[dimension] = {};
      for (let month = 1; month <= 12; month++) {
        milestonesByDimension[dimension][month] = [];
      }
      
      // Initialize goals array
      goalsByDimension[dimension] = [];
      
      // Initialize completion status
      dimensionCompletionStatus[dimension] = {
        milestones: {
          1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [], 10: [], 11: [], 12: []
        },
        goals: []
      };
    });
    
    // Fill in milestone data
    milestones.forEach(milestone => {
      const { dimension, month, description, completed } = milestone;
      
      // Add to the milestones array
      milestonesByDimension[dimension][month].push(description);
      
      // Track completion status
      const index = milestonesByDimension[dimension][month].length - 1;
      dimensionCompletionStatus[dimension].milestones[month][index] = completed;
    });
    
    // Fill in goals data
    goals.forEach(goal => {
      const { dimension, description, completed } = goal;
      
      // Add to the goals array
      goalsByDimension[dimension].push(description);
      
      // Track completion status
      const index = goalsByDimension[dimension].length - 1;
      dimensionCompletionStatus[dimension].goals[index] = completed;
    });
    
    // Now we can proceed with the CSV generation
    // Build CSV content
    const monthHeaders = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    const headers = ['', 'Dimension', ...monthHeaders, 'Goals'];
    
    // Format headers properly
    const formattedHeaders = headers.map(formatCSVField).join(',');
    const rows: string[] = [formattedHeaders];
    
    // For each dimension
    Object.entries(milestonesByDimension).forEach(([dimension, monthData]) => {
      const dimensionGoals = goalsByDimension[dimension as Dimension];
      
      // Determine the number of rows needed for this dimension
      // We need at least 3 rows for milestones (even if some are empty)
      // And we need enough rows for all goals
      const maxRows = Math.max(3, dimensionGoals.length);
      
      // Create rows for this dimension
      for (let row = 0; row < maxRows; row++) {
        const rowData: string[] = [];
        
        // Label - only on first row
        rowData.push(row === 0 ? 'Personal Annual Plan' : '');
        
        // Dimension - only on first row
        rowData.push(row === 0 ? dimension : '');
        
        // Month data
        monthHeaders.forEach((monthName) => {
          const monthNum = getMonthNumber(monthName);
          const milestones = monthData[monthNum];
          const completionStatus = dimensionCompletionStatus[dimension as Dimension].milestones[monthNum];
          
          let cellText = '';
          if (row < milestones.length) {
            cellText = milestones[row];
            // Add completion marker if completed
            if (completionStatus[row]) {
              cellText += ' (Completed)';
            }
          }
          
          rowData.push(cellText);
        });
        
        // Goal - if available for this row
        let goalText = '';
        if (row < dimensionGoals.length) {
          goalText = dimensionGoals[row];
          // Add completion marker if completed
          if (dimensionCompletionStatus[dimension as Dimension].goals[row]) {
            goalText += ' (Completed)';
          }
        }
        rowData.push(goalText);
        
        // Format and join row data
        const formattedRowData = rowData.map(formatCSVField);
        rows.push(formattedRowData.join(','));
      }
    });
    
    const csvContent = rows.join('\n');
    
    // In a real app, this would be an API call to save the CSV file
    // For now, we'll just log the CSV content and save to localStorage
    console.log('CSV Export Content:', csvContent);
    localStorage.setItem('lifeGoalsCSV', csvContent);
    
    // If this were a real app, we'd make an API call here
    // return await saveCSVToFile(csvContent);
    
    return true;
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    return false;
  }
}

/**
 * Mock function to fetch CSV from file or API
 * In a real app, this would make an API call to read the file
 */
async function fetchCSVFile(): Promise<string> {
  // Node.js: read from file
  if (typeof window === 'undefined') {
    const fs = await import('fs/promises');
    // Adjust path for project root
    return await fs.readFile('./csv/halavins.csv', 'utf-8');
  }

  // Browser: use localStorage
  const savedCSV = localStorage.getItem('lifeGoalsCSV');
  if (savedCSV) {
    return savedCSV;
  }

  // Fallback: throw error
  throw new Error('No CSV data found');
}

/**
 * Mock function to save CSV to file or API
 * In a real app, this would make an API call to write the file
 */
async function saveCSVToFile(csvContent: string): Promise<boolean> {
  // In a real application, this would make an API call
  localStorage.setItem('lifeGoalsCSV', csvContent);
  return true;
} 