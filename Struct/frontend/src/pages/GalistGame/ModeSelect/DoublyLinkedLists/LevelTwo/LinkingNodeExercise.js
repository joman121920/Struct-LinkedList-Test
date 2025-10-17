// LinkedListExercise.js - Exercise validation system for linked list creation
const NULL_POINTER = "null";
export class LinkedListExercise {
  constructor(exerciseData) {
    this.sequence = exerciseData.sequence;
    this.addresses = exerciseData.addresses;
    this.title = exerciseData.title;
    this.description = exerciseData.description;
  }
}
 

// Predefined exercise templates
export const EXERCISE_TEMPLATES = {
  exercise_one: {
    sequence: [5, 10, 15, 20, 25],
    addresses: {
      5: "aa",
      10: "bb",
      15: "cc",
      20: "dd",
      25: "ee"
    },
    title: "Create this Linked List",
    description: "Create a linked list with the following values: 5 -> 10 -> 15 -> 20 -> 25"
  },
  exercise_two: {
    sequence: [12, 8, 3, 25, 14, 7],
    addresses: {
      12: "f10",
      8: "g20",
      3: "h30",
      25: "i40",
      14: "j50",
      7: "k60",
    },
    title: "Create this Linked Lists",
    description: "Create a linked list with the following values: 12 -> 8 -> 3 -> 25 -> 14 -> 7"
  },
  exercise_three: {
    sequence: [30, 28, 26, 32, 40, 42, 44],
    addresses: {
      30: "s101",
      28: "t103",
      26: "u105",
      32: "v107",
      40: "w109",
      42: "x111",
      44: "y113"
    },
    title: "Create this Linked Lists",
    description: "Create a linked list with the following values: 30 -> 28 -> 26 -> 32 -> 40 -> 42 -> 44"
  }
  
};
// Exercise manager class
export class ExerciseManager {
  constructor() {
    this.currentExercise = null;
    this.submissionData = null;
    this.isWaitingForValidation = false;
  }

  // Load an exercise
  loadExercise(templateKey) {
    const template = EXERCISE_TEMPLATES[templateKey];
    if (!template) {
      throw new Error(`Exercise template "${templateKey}" not found`);
    }
    
    this.currentExercise = new LinkedListExercise(template);
    this.submissionData = null;
    this.isWaitingForValidation = false;
    
    // Build expectedStructure for UI display
    this.currentExercise.key = templateKey;
    this.currentExercise.expectedStructure = template.sequence.map((value, index) => {
      const address = template.addresses[value];
      const prevValue = index > 0 ? template.sequence[index - 1] : null;
      const nextValue = index < template.sequence.length - 1 ? template.sequence[index + 1] : null;

      const prevAddress =
        prevValue != null && template.addresses[prevValue]
          ? String(template.addresses[prevValue])
          : NULL_POINTER;
      const nextAddress =
        nextValue != null && template.addresses[nextValue]
          ? String(template.addresses[nextValue])
          : NULL_POINTER;

      return {
        value,
        address: String(address),
        prevAddress,
        nextAddress,
      };
    });
    
    // Set next addresses based on sequence order
    for (let i = 0; i < this.currentExercise.expectedStructure.length - 1; i++) {
      this.currentExercise.expectedStructure[i].next = this.currentExercise.expectedStructure[i + 1].address;
    }
    // Last node points to null
    if (this.currentExercise.expectedStructure.length > 0) {
      this.currentExercise.expectedStructure[this.currentExercise.expectedStructure.length - 1].next = 'null';
    }
    
    return this.currentExercise;
  }

  // Submit answer for validation (called when user opens suction)
  submitAnswer(circles, connections) {
    if (!this.currentExercise) {
      throw new Error('No exercise loaded');
    }

    // Store the submission data for later validation
    this.submissionData = {
      circles: JSON.parse(JSON.stringify(circles)), // Deep copy
      connections: JSON.parse(JSON.stringify(connections)) // Deep copy
    };
    
    this.isWaitingForValidation = true;
    return true;
  }

  // Validate submission (called after all circles are sucked)
  validateSubmission(circles = null, connections = null, entryOrder = null) {
    console.log('validateSubmission called with:', { circles, connections, entryOrder });
    
    // If parameters are provided (even if empty arrays), use them directly (for portal validation)
    if (circles !== null && connections !== null) {
      console.log('Using provided parameters for validation');
      
      if (!this.currentExercise) {
        console.warn('No exercise loaded, attempting to load basic exercise...');
        try {
          this.loadExercise('exercise_one');
        } catch (loadError) {
          console.error('Failed to load default exercise:', loadError);
          // Return a gentle error instead of throwing
          return {
            isCorrect: false,
            message: 'System not ready',
            details: 'Please try again in a moment.',
            score: 0,
            totalPoints: 100
          };
        }
      }

      const result = this.currentExercise.validateSubmission(
        circles,
        connections,
        entryOrder
      );

      return result;
    }

    // Otherwise, use stored submission data (for manual validation)
    console.log('Using stored submission data for validation');
    
    if (!this.currentExercise) {
      console.error('No exercise loaded for manual validation');
      return {
        isCorrect: false,
        message: 'System not ready',
        details: 'Please refresh and try again.',
        score: 0,
        totalPoints: 100
      };
    }
    
    if (!this.submissionData) {
      console.warn('No stored submission data for manual validation');
      return {
        isCorrect: false,
        message: 'No submission found',
        details: 'Please create your linked list first.',
        score: 0,
        totalPoints: 100
      };
    }

    const result = this.currentExercise.validateSubmission(
      this.submissionData.circles,
      this.submissionData.connections,
      entryOrder
    );

    this.isWaitingForValidation = false;
    return result;
  }

  // Get current exercise info
  getCurrentExercise() {
    return this.currentExercise;
  }

  // Check if waiting for validation
  isWaiting() {
    return this.isWaitingForValidation;
  }

  // Reset the manager
  reset() {
    this.submissionData = null;
    this.isWaitingForValidation = false;
  }
}
