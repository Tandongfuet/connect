import type { AgriculturalTask } from '../types';

export const agriculturalTasks: AgriculturalTask[] = [
  // January - Dry Season Peak
  { id: 'task_1', month: 1, region: 'North-West', crop: 'Potatoes', task: 'Begin land preparation for planting', taskType: 'Planting', icon: '🌱', details: { timing: 'Early morning to avoid heat.', equipment: 'Hoes, spades, or tractor with plough.' } },
  { id: 'task_2', month: 1, region: 'Littoral', crop: 'Mangoes', task: 'Harvest early mango varieties', taskType: 'Harvesting', icon: '🥭', details: { timing: 'Harvest when fruit is mature green and shows a slight yellow blush.', equipment: 'Picking poles, baskets.' } },
  { id: 'task_3', month: 1, region: 'South', crop: 'Cassava', task: 'Weed and tend to growing cassava fields', taskType: 'Tending', icon: '🌿', details: { timing: 'Perform weeding 3-4 weeks after planting.', equipment: 'Hand hoes.' } },
  { id: 'task_4', month: 1, region: 'Centre', crop: 'Tomatoes', task: 'Monitor for pests like whiteflies in dry conditions', taskType: 'Pest Control', icon: '🛡️', details: { dosage: 'Apply neem oil solution (5ml per liter of water) weekly as a preventative measure.', timing: 'Spray in the late evening.' } },

  // February
  { id: 'task_5', month: 2, region: 'West', crop: 'Beans', task: 'Start planting climbing beans', taskType: 'Planting', icon: '🌱', details: { timing: 'Plant at the onset of the first rains.', equipment: 'Stakes for support, hoes.' } },
  { id: 'task_6', month: 2, region: 'South-West', crop: 'Avocado', task: 'Harvest mid-season avocado varieties', taskType: 'Harvesting', icon: '🥑', details: { timing: 'Harvest when fruits are mature but still firm.', equipment: 'Baskets, clippers.' } },
  { id: 'task_7', month: 2, region: 'Far North', crop: 'Onions', task: 'Cure and store harvested onions', taskType: 'Harvesting', icon: '🧅', details: { timing: 'Dry in a well-ventilated area for 2-3 weeks before storing.', equipment: 'Storage racks.' } },

  // March - First Rains
  { id: 'task_8', month: 3, region: 'Centre', crop: 'Maize', task: 'Plant first-season maize with early rains', taskType: 'Planting', icon: '🌽', details: { timing: 'Immediately after the first consistent rains.', equipment: 'Planting ropes, hoes.' } },
  { id: 'task_9', month: 3, region: 'Littoral', crop: 'Plantains', task: 'Apply organic mulch to retain moisture', taskType: 'Tending', icon: '🌿', details: { dosage: 'Apply a 5-10cm layer of dried leaves or grass around the base.', equipment: 'Wheelbarrow, rake.' } },
  { id: 'task_10', month: 3, region: 'North-West', crop: 'Cabbage', task: 'Monitor for aphids as humidity increases', taskType: 'Pest Control', icon: '🛡️', details: { timing: 'Inspect under leaves weekly.', dosage: 'Use a soap and water solution for minor infestations.' } },

  // April
  { id: 'task_11', month: 4, region: 'South', crop: 'Groundnuts', task: 'Plant groundnuts in well-drained soil', taskType: 'Planting', icon: '🥜', details: { timing: 'April is the ideal month for planting in this region.', equipment: 'Hoes.' } },
  { id: 'task_12', month: 4, region: 'West', crop: 'Coffee', task: 'Harvest main season arabica coffee beans', taskType: 'Harvesting', icon: '☕', details: { timing: 'Pick only ripe, red cherries.', equipment: 'Baskets, tarpaulins.' } },
  { id: 'task_13', month: 4, region: 'East', crop: 'Cocoa', task: 'Prune cocoa trees after main harvest', taskType: 'Tending', icon: '🌿', details: { timing: 'Remove dead branches and chupons to improve air circulation.', equipment: 'Pruning shears, saws.' } },
  
  // May
  { id: 'task_14', month: 5, region: 'North-West', crop: 'Tomatoes', task: 'Stake tomato plants for support', taskType: 'Tending', icon: '🌿', details: { timing: 'When plants are about 30cm tall.', equipment: 'Wooden stakes, twine.' } },
  { id: 'task_15', month: 5, region: 'Centre', crop: 'Maize', task: 'First weeding of maize fields', taskType: 'Tending', icon: '🌿', details: { timing: '2-3 weeks after germination.', equipment: 'Hand hoes.' } },
  { id: 'task_16', month: 5, region: 'Littoral', crop: 'Pineapples', task: 'Harvest sweet cayenne pineapples', taskType: 'Harvesting', icon: '🍍', details: { timing: 'Harvest when the fruit has a golden yellow color and a sweet smell.', equipment: 'Gloves, sharp knife.' } },

  // June - Rainy Season
  { id: 'task_17', month: 6, region: 'South-West', crop: 'Yams', task: 'Plant yams on prepared mounds', taskType: 'Planting', icon: '🍠', details: { timing: 'At the peak of the rainy season.', equipment: 'Hoes for mounding.' } },
  { id: 'task_18', month: 6, region: 'West', crop: 'Beans', task: 'Monitor for fungal diseases due to high humidity', taskType: 'Pest Control', icon: '🛡️', details: { dosage: 'Apply a copper-based fungicide if necessary.', timing: 'Spray after rain.' } },
  { id: 'task_19', month: 6, region: 'East', crop: 'Okra', task: 'Begin harvesting okra pods regularly', taskType: 'Harvesting', icon: '🥬', details: { timing: 'Harvest every 2 days when pods are young and tender.', equipment: 'Clippers.' } },

  // July
  { id: 'task_20', month: 7, region: 'Centre', crop: 'Maize', task: 'Harvest green maize (roasting corn)', taskType: 'Harvesting', icon: '🌽', details: { timing: 'When kernels are milky.', equipment: 'Bags.' } },
  { id: 'task_21', month: 7, region: 'North-West', crop: 'Potatoes', task: 'Apply second round of fertilizer', taskType: 'Tending', icon: '🌿', details: { dosage: 'NPK 15-15-15 at a rate of 200kg/hectare.', timing: 'Apply at the base of the plants.' } },
  { id: 'task_22', month: 7, region: 'Littoral', crop: 'Papaya', task: 'Harvest ripe papayas', taskType: 'Harvesting', icon: '🥭', details: { timing: 'When skin turns from green to yellow.', equipment: 'Picking poles.' } },
  
  // August
  { id: 'task_23', month: 8, region: 'North-West', crop: 'Potatoes', task: 'Monitor for late blight, a common fungal disease', taskType: 'Pest Control', icon: '🛡️', details: { timing: 'Inspect leaves daily, especially after cool, damp nights.', dosage: 'Use preventative fungicide sprays.' } },
  { id: 'task_24', month: 8, region: 'West', crop: 'Avocados', task: 'Harvest late-season avocado varieties', taskType: 'Harvesting', icon: '🥑', details: { timing: 'Check for mature size and slight color change.', equipment: 'Baskets.' } },
  { id: 'task_25', month: 8, region: 'South', crop: 'Cassava', task: 'Begin harvesting mature cassava roots', taskType: 'Harvesting', icon: '🥔', details: { timing: '8-12 months after planting.', equipment: 'Machetes, hoes.' } },

  // September
  { id: 'task_26', month: 9, region: 'Centre', crop: 'Maize', task: 'Harvest and dry main season maize', taskType: 'Harvesting', icon: '🌽', details: { timing: 'When husks are dry and brown.', equipment: 'Tarpaulins for drying.' } },
  { id: 'task_27', month: 9, region: 'Far North', crop: 'Sorghum', task: 'Plant sorghum as rains begin to subside', taskType: 'Planting', icon: '🌱', details: { timing: 'Take advantage of the last rains for germination.', equipment: 'Hoes.' } },
  { id: 'task_28', month: 9, region: 'South-West', crop: 'Yams', task: 'Weed and train yam vines', taskType: 'Tending', icon: '🌿', details: { timing: 'Ensure vines climb stakes for better tuber development.', equipment: 'Stakes, twine.' } },

  // October
  { id: 'task_29', month: 10, region: 'North-West', crop: 'Potatoes', task: 'Harvest main crop of potatoes', taskType: 'Harvesting', icon: '🥔', details: { timing: 'When vines have died back.', equipment: 'Spades, baskets.' } },
  { id: 'task_30', month: 10, region: 'West', crop: 'Beans', task: 'Harvest and dry beans', taskType: 'Harvesting', icon: '🫘', details: { timing: 'When pods are dry and brittle.', equipment: 'Threshing sticks, tarps.' } },
  { id: 'task_31', month: 10, region: 'Littoral', crop: 'Bananas', task: 'Prune banana plants and manage suckers', taskType: 'Tending', icon: '🍌', details: { timing: 'Remove old leaves and excess suckers to promote fruit growth.', equipment: 'Machete.' } },

  // November
  { id: 'task_32', month: 11, region: 'Centre', crop: 'Vegetables', task: 'Start second season vegetable planting in dry riverbeds', taskType: 'Planting', icon: '🌱', details: { timing: 'Utilize residual moisture for off-season crops.', equipment: 'Watering cans.' } },
  { id: 'task_33', month: 11, region: 'South-West', crop: 'Yams', task: 'Harvest yams', taskType: 'Harvesting', icon: '🍠', details: { timing: 'Before the soil becomes too hard.', equipment: 'Digging sticks, hoes.' } },
  { id: 'task_34', month: 11, region: 'East', crop: 'Cocoa', task: 'Main cocoa harvest begins', taskType: 'Harvesting', icon: '🍫', details: { timing: 'Harvest ripe pods every 2-3 weeks.', equipment: 'Sharp knives, baskets.' } },

  // December
  { id: 'task_35', month: 12, region: 'Far North', crop: 'Onions', task: 'Transplant onion seedlings', taskType: 'Planting', icon: '🧅', details: { timing: 'During the cooler part of the day.', equipment: 'Hand trowels.' } },
  { id: 'task_36', month: 12, region: 'Littoral', crop: 'Watermelon', task: 'Harvest watermelons for the holiday season', taskType: 'Harvesting', icon: '🍉', details: { timing: 'When the tendril nearest the fruit stem is dry.', equipment: 'Bags, carts.' } },
  { id: 'task_37', month: 12, region: 'West', crop: 'Coffee', task: 'Begin harvesting robusta coffee cherries', taskType: 'Harvesting', icon: '☕', details: { timing: 'Selectively pick ripe, red cherries.', equipment: 'Baskets.' } },
];
