// NodeCreationExercise.js - Exercise definitions for Node Creation levels

// Exercise data structure for three mini-levels
const exerciseDefinitions = {
  level_1: {
    id: "level_1",
    name: "Level 1: Basic Node Creation",
    description: "Create a node with the correct value and address",
    expectedOutput: {
      value: "10",
      address: "ab7"
    },
    availableValues: ["10", "25", "33", "47", "89"], // 5 values including the correct one
    availableAddresses: ["ab7", "x2c", "f9d", "e1a", "b6f"], // 5 addresses including the correct one
    floatingCircleCount: 12, // Total floating circles (values + addresses + random)
    difficulty: "easy"
  },
  
  level_2: {
    id: "level_2", 
    name: "Level 2: Intermediate Node Creation",
    description: "Create a node with specific value and address combination",
    expectedOutput: {
      value: "67",
      address: "c4k"
    },
    availableValues: ["67", "12", "98", "54", "71"], // 5 values including the correct one
    availableAddresses: ["c4k", "m8n", "p2q", "z7y", "w3v"], // 5 addresses including the correct one
    floatingCircleCount: 12,
    difficulty: "medium"
  },
  
  level_3: {
    id: "level_3",
    name: "Level 3: Advanced Node Creation", 
    description: "Create a node with complex value and address",
    expectedOutput: {
      value: "142",
      address: "x9z"
    },
    availableValues: ["142", "203", "176", "85", "91"], // 5 values including the correct one
    availableAddresses: ["x9z", "q1w", "r5t", "h8j", "d2s"], // 5 addresses including the correct one
    floatingCircleCount: 12,
    difficulty: "hard"
  }
};

// Generate random content for additional floating circles
const generateRandomContent = () => {
  const randomValues = ["77", "39", "156", "21", "88", "104", "63", "195"];
  const randomAddresses = ["k6l", "n4m", "u7i", "o9p", "a1s", "g3h", "j5k", "v8c"];
  
  return {
    values: randomValues,
    addresses: randomAddresses
  };
};

// Shuffle array utility function
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Exercise Manager class
export class ExerciseManager {
  constructor() {
    this.exercises = exerciseDefinitions;
    this.currentLevel = "level_1";
  }

  // Load exercise by key
  loadExercise(key = "level_1") {
    const exercise = this.exercises[key];
    if (!exercise) {
      console.warn(`Exercise ${key} not found, loading level_1`);
      return this.exercises.level_1;
    }
    
    this.currentLevel = key;
    return exercise;
  }

  // Get all available exercises
  getAllExercises() {
    return Object.values(this.exercises);
  }

  // Get next level
  getNextLevel(currentLevel) {
    const levels = ["level_1", "level_2", "level_3"];
    const currentIndex = levels.indexOf(currentLevel);
    
    if (currentIndex < levels.length - 1) {
      return levels[currentIndex + 1];
    }
    
    return null; // No next level
  }

  // Generate floating circles for a specific level
  generateFloatingCircles(levelKey) {
    const exercise = this.exercises[levelKey];
    if (!exercise) return [];

    const randomContent = generateRandomContent();
    const circles = [];

    // Add the correct value and address (must be included)
    circles.push({
      id: `value-correct-${Date.now()}`,
      type: 'value',
      content: exercise.expectedOutput.value,
      isCorrect: true
    });

    circles.push({
      id: `address-correct-${Date.now() + 1}`,
      type: 'address', 
      content: exercise.expectedOutput.address,
      isCorrect: true
    });

    // Add other available values for this level (excluding the correct one)
    const otherValues = exercise.availableValues.filter(v => v !== exercise.expectedOutput.value);
    otherValues.forEach((value, index) => {
      circles.push({
        id: `value-${levelKey}-${index}-${Date.now()}`,
        type: 'value',
        content: value,
        isCorrect: false
      });
    });

    // Add other available addresses for this level (excluding the correct one)
    const otherAddresses = exercise.availableAddresses.filter(a => a !== exercise.expectedOutput.address);
    otherAddresses.forEach((address, index) => {
      circles.push({
        id: `address-${levelKey}-${index}-${Date.now()}`,
        type: 'address',
        content: address,
        isCorrect: false
      });
    });

    // Fill remaining slots with random content to reach floatingCircleCount
    const targetCount = exercise.floatingCircleCount;
    const remaining = targetCount - circles.length;
    
    for (let i = 0; i < remaining; i++) {
      const isValue = i % 2 === 0;
      const randomArray = isValue ? randomContent.values : randomContent.addresses;
      const randomIndex = Math.floor(Math.random() * randomArray.length);
      
      circles.push({
        id: `random-${isValue ? 'value' : 'address'}-${i}-${Date.now()}`,
        type: isValue ? 'value' : 'address',
        content: randomArray[randomIndex],
        isCorrect: false
      });
    }

    // Shuffle the circles so correct answers aren't always in the same position
    return shuffleArray(circles);
  }

  // Validate if the user's selection matches expected output
  validateLevel(levelKey, userValue, userAddress) {
    const exercise = this.exercises[levelKey];
    if (!exercise) return false;

    const valueCorrect = userValue === exercise.expectedOutput.value;
    const addressCorrect = userAddress === exercise.expectedOutput.address;

    return {
      isCorrect: valueCorrect && addressCorrect,
      valueCorrect,
      addressCorrect,
      expectedValue: exercise.expectedOutput.value,
      expectedAddress: exercise.expectedOutput.address,
      score: (valueCorrect && addressCorrect) ? 100 : 0
    };
  }

  // Check if there's a next level available
  hasNextLevel(currentLevel) {
    return this.getNextLevel(currentLevel) !== null;
  }

  // Get level progress (useful for UI indicators)
  getLevelProgress(currentLevel) {
    const levels = ["level_1", "level_2", "level_3"];
    const currentIndex = levels.indexOf(currentLevel);
    
    return {
      current: currentIndex + 1,
      total: levels.length,
      percentage: ((currentIndex + 1) / levels.length) * 100
    };
  }
}

// Export exercise definitions for use in other files if needed
export { exerciseDefinitions };
