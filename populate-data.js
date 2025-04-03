/**
 * Life Dimensions Data Population Script
 * 
 * This script parses the CSV data and fills the application with milestones and goals.
 * Run this script in the browser console after the application has loaded.
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
  
  // Function to add milestones to the application
  function addMilestones() {
    const app = document.querySelector('div[class^="App"]');
    if (!app) {
      console.error('Could not find App component');
      return;
    }
    
    // Access the React instance
    const appInstance = Object.keys(app).find(key => key.startsWith('__reactFiber$'));
    if (!appInstance) {
      console.error('Could not find React instance');
      return;
    }
    
    // Access React component's state setters
    const reactInstance = app[appInstance];
    let fiber = reactInstance;
    
    // Find the component that holds the state
    while (fiber) {
      if (fiber.stateNode && typeof fiber.stateNode.setState === 'function') {
        // Add all milestones and goals
        let allMilestones = [];
        let allGoals = [];
        
        Object.values(dimensionData).forEach(data => {
          allMilestones = [...allMilestones, ...data.milestones];
          allGoals = [...allGoals, ...data.goals];
        });
        
        // Assign unique IDs
        allMilestones = allMilestones.map((milestone, index) => ({ 
          ...milestone, 
          id: `m-${index + 1}` 
        }));
        
        allGoals = allGoals.map((goal, index) => ({ 
          ...goal, 
          id: `g-${index + 1}` 
        }));
        
        // Update state
        fiber.stateNode.setState({ 
          milestones: allMilestones,
          goals: allGoals 
        });
        
        console.log('Successfully added data to the application!');
        console.log(`Added ${allMilestones.length} milestones and ${allGoals.length} goals.`);
        return;
      }
      fiber = fiber.return;
    }
    
    console.error('Could not find component state');
  }
  
  // Alternative method: manipulate through UI if React direct access fails
  function addDataThroughUI() {
    console.log('Attempting to add data through UI simulation...');
    
    // Try to access App component methods
    const app = document.querySelector('div[class^="App"]');
    if (!app) {
      console.error('Could not find App component');
      return;
    }
    
    // Find any buttons or interactable elements
    const addButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
      btn.textContent.includes('Add') || 
      btn.innerHTML.includes('plus') ||
      btn.innerHTML.includes('Plus')
    );
    
    if (addButtons.length === 0) {
      console.error('Could not find add buttons');
      return;
    }
    
    console.log('Found potential add buttons:', addButtons.length);
    console.log('Please use the UI to manually add the data. The parsed data is available in the console.');
    console.log('Dimension data:', dimensionData);
  }
  
  // Try direct state manipulation first, then fall back to UI guidance
  try {
    addMilestones();
  } catch (err) {
    console.error('Direct state manipulation failed:', err);
    console.log('Falling back to UI-based approach...');
    addDataThroughUI();
  }
  
  // Export parsed data to global scope for manual use if needed
  window.dimensionData = dimensionData;
  console.log('Parsed data is available in window.dimensionData for manual use if needed');
})(); 