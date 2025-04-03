/**
 * Life Dimensions Data Populator - Simple UI Version
 * 
 * This script helps fill the Life Dimensions application with milestone and goal data 
 * by simulating user interactions with the UI.
 */

(function() {
  // CSV data (copied from the file)
  const csvData = `,Dimension,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec,Jan,Feb,Mar,Goals
Personal Annual Plan,Family,Move to Florida; ,Choose initial simple home-learning activity,"Enroll Deusie in structured group classes (sports, arts, etc.)",Establish consistent daily educational/play routine,Regularly attend structured social activities/classes,Participate in local parent-child social groups,Arrange first casual playdate from structured group contacts,Evaluate progress in educational/social activities; ,Increase frequency of structured activities for socializing,Regular review and adjustment of home-learning activities,Evaluate yearly progress and adjust plans accordingly,Finalize clear next year's education/socialization plan,Deusie is educated without nanny: Montessori school or home-schooling; 
,,explore Montessori/home-schooling options,,,,,,,,,,,,Deusie socializes and makes friends: gym or something; 
,,,,,,,,,adjust if needed,,,,,We live in warm climate; 
,Health,Find dentist in Florida; ,Address immediate tooth pain; ,Begin addressing remaining dental issues,Evaluate ergonomic home/work setup;,Establish consistent routine for teeth protection at night,Identify effective relaxation method before bedtime,"Implement nightly stress-reduction ritual (meditation, stretches)",Evaluate sleep quality and adjust sleeping arrangements,Regular check-in with dentist; ,Incorporate gentle daily exercise (yoga or stretching),Reassess ergonomic setup effectiveness; ,Annual dental check-up; ,No pain in the teeth
,,schedule initial appointment,,,,,,,,,,,,Healthy stress-less sleep
,,,create dental care plan,,,,,,,,,,,"No pain while working, driving, or crafting"
,Wealth,List Hawaii home for sale; ,Negotiate Hawaii sale; ,Finalize Hawaii home sale; ,Settle family into rented home;,"Invest home sale proceeds into diversified, conservative portfolio",List business for sale; ,Negotiate sale terms; ,Finalize business sale;,Evaluate passive income; ,Review investment portfolio performance;,Refine long-term financial strategy;,Establish clear financial roadmap for next year,$4-5M in liquid capital
,,move into Florida Airbnb,find furnished long-term rental in Florida,move into long-term Florida rental,establish isolated workspace,,refine pitch/valuation,secure buyer for business, reinvest conservatively for stable income,optimize expenses to maximize liquidity,,,,"dog has a place to poop; I have a place to work, float and sunbathe"
,,,,,,,,,,, adjust as needed, liquidity-focused,,"I have a stable capital gain income to provide for family, and be creative"
,Self-realization,Set up personal website/Substack (Russian),Publish first new article in Russian,"Develop clear concept & sober writing plan for ""Code of Life""","Write/revise ""Code of Life""; monthly progress check-in",Share monthly insights/articles on Substack/website,Develop concept/demo for Bun's Adventures or Anti MMO game,Build basic playable prototype for the game,Post monthly game development updates and gather feedback,"Complete full draft of ""Code of Life"" script",Host online event/Q&A about insights & game progress,Collaborate with influencer to promote content/game,Evaluate year's progress; set clear next goals,I'm openly sharing my experiences and insights with the world
,,,,,,,,,,,,,,I'm developing an engaging 3D game
,,,,,,,,,,,,,,
,Friends,Join local sober or outdoor-interest groups,Regularly attend chosen sober/outdoor interest groups/events,Introduce yourself to at least one new acquaintance,Initiate casual meet-up with new acquaintance(s),Establish weekly routine for sober/outdoor social interactions,Identify and nurture deeper connections within groups,Participate in shared outdoor activity or sober social event,Regularly engage in meaningful activities with new friends,Deepen relationships; ,Reflect on friendships built; ,Plan continued friendship-building activities for coming year,Establish clear goals for maintaining sober friendships,I have at least one sober friend to spend time with every week
,,,,,,,,,,host or organize casual group events,assess satisfaction,,,
,,,,,,,,,,,,,,
,Leisure,Research easy travel logistics for Puerto Rico,Plan itinerary/logistics for family trip to Puerto Rico,Take family vacation (Puerto Rico); ,Document family feedback; ,"Research easy-access snowy locations (Colorado, Vermont)",Book suitable snowy destination family vacation,Prepare logistics/travel details for winter vacation,Enjoy snowy vacation;,Reflect on leisure trips; ,Discuss and shortlist next year's vacation options,Establish realistic leisure travel budget,Finalize clear leisure/travel goals for coming year,Take a vacation in Puerto Rico
,,,,evaluate relocation potential,assess practicality of potential move,,,, document experiences and family enjoyment,discuss future travel interests,,,,Snowy vacation in Colorado/Vermont`;

  // Parse CSV data
  const lines = csvData.split('\n');
  const headers = lines[0].split(',');
  
  // Extract month indexes
  const monthIndexes = {};
  headers.forEach((header, index) => {
    if (["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"].includes(header)) {
      // Convert month to number (1-12)
      // Apr is 4, May is 5, etc. but Jan is 1, Feb is 2, Mar is 3
      let monthNum = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"].indexOf(header) + 1;
      if (monthNum > 9) monthNum = monthNum - 9; // Adjust Jan, Feb, Mar to 1, 2, 3
      monthIndexes[header] = { index, monthNum };
    }
  });
  
  // Extract dimension data
  const dimensionData = {};
  let currentDimension = null;
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',');
    
    // If this row has a dimension, update current dimension
    if (cells[1] && cells[1] !== '') {
      currentDimension = cells[1].toLowerCase();
      dimensionData[currentDimension] = {
        milestones: [],
        goals: []
      };
    }
    
    if (currentDimension) {
      // Process milestones for each month
      Object.entries(monthIndexes).forEach(([month, { index, monthNum }]) => {
        if (cells[index] && cells[index].trim() !== '') {
          dimensionData[currentDimension].milestones.push({
            dimension: currentDimension,
            month: monthNum,
            description: cells[index],
            completed: false,
            futureTense: cells[index],
            pastTense: cells[index]
          });
        }
      });
      
      // Process goals (last column)
      const goalIndex = headers.indexOf('Goals');
      if (goalIndex !== -1 && cells[goalIndex] && cells[goalIndex].trim() !== '') {
        dimensionData[currentDimension].goals.push({
          dimension: currentDimension,
          description: cells[goalIndex],
          completed: false
        });
      }
    }
  }

  // Make data available globally for console access
  window.dimensionData = dimensionData;
  
  // Prepare UI instructions
  console.log('%c Life Dimensions Data Populator ', 'background: #4CAF50; color: white; font-size: 16px; padding: 5px;');
  console.log('%c Follow these steps to add your data: ', 'background: #2196F3; color: white; font-size: 14px; padding: 3px;');
  
  // Generate instructions for milestones
  console.log('%c 1. Adding Milestones: ', 'font-weight: bold; font-size: 14px; color: #333;');
  
  Object.entries(dimensionData).forEach(([dimension, data]) => {
    console.log(`%c   ${dimension.toUpperCase()} Dimension: ${data.milestones.length} milestones`, 'font-weight: bold; color: #0277BD;');
    
    data.milestones.forEach(milestone => {
      console.log(`   - Month ${milestone.month}: "${milestone.description}"`);
    });
    
    console.log('');
  });
  
  // Generate instructions for goals
  console.log('%c 2. Adding Goals: ', 'font-weight: bold; font-size: 14px; color: #333;');
  
  Object.entries(dimensionData).forEach(([dimension, data]) => {
    console.log(`%c   ${dimension.toUpperCase()} Dimension Goals:`, 'font-weight: bold; color: #00796B;');
    
    data.goals.forEach(goal => {
      console.log(`   - "${goal.description}"`);
    });
    
    console.log('');
  });
  
  // Provide helper function to add a single milestone
  window.addMilestone = function(dimension, month, description) {
    // Find the + button at the bottom right
    const addButton = document.querySelector('button');
    if (addButton) {
      addButton.click();
      
      // Wait for sidebar to appear
      setTimeout(() => {
        // Find dimension select
        const dimensionSelect = document.querySelector('select');
        if (dimensionSelect) {
          // Set dimension
          dimensionSelect.value = dimension;
          dimensionSelect.dispatchEvent(new Event('change', { bubbles: true }));
          
          // Set month (second select)
          const monthSelect = document.querySelectorAll('select')[1];
          if (monthSelect) {
            monthSelect.value = month;
            monthSelect.dispatchEvent(new Event('change', { bubbles: true }));
            
            // Click the continue button
            const continueButton = document.querySelector('button[type="submit"]');
            if (continueButton) {
              continueButton.click();
              
              // Wait for next screen to appear
              setTimeout(() => {
                // Fill description
                const textarea = document.querySelector('textarea');
                if (textarea) {
                  textarea.value = description;
                  textarea.dispatchEvent(new Event('input', { bubbles: true }));
                  
                  // Click add button
                  const addMilestoneButton = document.querySelector('button[type="submit"]');
                  if (addMilestoneButton) {
                    addMilestoneButton.click();
                    console.log(`Added milestone: ${dimension}, Month ${month}: ${description}`);
                  }
                }
              }, 300);
            }
          }
        }
      }, 300);
    } else {
      console.error('Could not find add button');
    }
  };
  
  // Provide helper function to add a goal
  window.addGoal = function(dimension, description) {
    // Find dimension row
    const dimensionRows = Array.from(document.querySelectorAll('.grid-cols-\\[200px_repeat\\(12\\,1fr\\)_250px\\] > div:first-child'));
    const dimensionIndex = dimensionRows.findIndex(row => 
      row.textContent.toLowerCase().includes(dimension.toLowerCase())
    );
    
    if (dimensionIndex >= 0) {
      // Find the add goal button in that row
      const goalCells = document.querySelectorAll(`.grid-cols-\\[200px_repeat\\(12\\,1fr\\)_250px\\] > div:nth-child(${dimensionIndex + 1}) > div:last-child button`);
      const addGoalButton = Array.from(goalCells).find(btn => btn.textContent.includes('Add Goal'));
      
      if (addGoalButton) {
        addGoalButton.click();
        
        // Wait for modal to appear
        setTimeout(() => {
          // Fill description
          const textarea = document.querySelector('textarea');
          if (textarea) {
            textarea.value = description;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            
            // Click add button
            const addGoalButton = document.querySelector('button[type="submit"]');
            if (addGoalButton) {
              addGoalButton.click();
              console.log(`Added goal for ${dimension}: ${description}`);
            }
          }
        }, 300);
      } else {
        console.error(`Could not find Add Goal button for ${dimension}`);
      }
    } else {
      console.error(`Could not find row for dimension ${dimension}`);
    }
  };
  
  // Interactive helpers message
  console.log('%c Helper Functions Available: ', 'background: #FF5722; color: white; font-size: 14px; padding: 3px;');
  console.log(`
  You can use these helper functions in the console:
  
  1. addMilestone(dimension, month, description)
     Example: addMilestone('health', 4, 'Find dentist in Florida')
  
  2. addGoal(dimension, description)
     Example: addGoal('health', 'No pain in the teeth')
  
  3. dimensionData
     Access all parsed data from the CSV
  `);
  
  // Ask if user wants to autofill everything
  if (confirm('Would you like to automatically add all milestones and goals? (This may take some time and you should not interact with the page during the process)')) {
    console.log('Starting automatic data entry. Please do not interact with the page...');
    
    let currentIndex = 0;
    const allMilestones = [];
    
    // Collect all milestones
    Object.entries(dimensionData).forEach(([dimension, data]) => {
      data.milestones.forEach(milestone => {
        allMilestones.push({
          dimension,
          month: milestone.month,
          description: milestone.description
        });
      });
    });
    
    // Function to add milestones one by one
    function addNextMilestone() {
      if (currentIndex < allMilestones.length) {
        const milestone = allMilestones[currentIndex];
        window.addMilestone(milestone.dimension, milestone.month, milestone.description);
        
        currentIndex++;
        setTimeout(addNextMilestone, 2000); // Wait 2 seconds between adds
      } else {
        console.log('All milestones added! Now adding goals...');
        addGoals();
      }
    }
    
    // Function to add all goals
    function addGoals() {
      let goalIndex = 0;
      const allGoals = [];
      
      // Collect all goals
      Object.entries(dimensionData).forEach(([dimension, data]) => {
        data.goals.forEach(goal => {
          allGoals.push({
            dimension,
            description: goal.description
          });
        });
      });
      
      // Function to add goals one by one
      function addNextGoal() {
        if (goalIndex < allGoals.length) {
          const goal = allGoals[goalIndex];
          window.addGoal(goal.dimension, goal.description);
          
          goalIndex++;
          setTimeout(addNextGoal, 2000); // Wait 2 seconds between adds
        } else {
          console.log('All data has been added successfully!');
        }
      }
      
      // Start adding goals
      addNextGoal();
    }
    
    // Start adding milestones
    addNextMilestone();
  } else {
    console.log('Automatic data entry cancelled. You can use the helper functions to add data manually.');
  }
})(); 