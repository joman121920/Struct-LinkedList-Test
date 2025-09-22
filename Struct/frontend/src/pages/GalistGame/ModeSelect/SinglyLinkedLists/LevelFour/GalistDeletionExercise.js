// NodeDeletionExercise.js - Exercise definitions for Node Deletion levels

// Exercise data structure for three mini-levels (each has an initial list and a deletion target)
const exerciseDefinitions = {
  level_1: {
    id: "level_1",
    name: "Level 1: Delete Head",
    description: "Delete the head node of the list",
    initialList: [
      { value: "10", address: "ab7" },
      { value: "25", address: "x2c" },
      { value: "33", address: "f9d" },
    ],
    target: { type: "head" },
    expectedStructure: [
      { value: "25", address: "x2c" },
      { value: "33", address: "f9d" },
    ],
    distractorCount: 2,
    difficulty: "easy",
  },
  level_2: {
    id: "level_2",
    name: "Level 2: Delete Middle (by value)",
    description: "Delete the node with value 54",
    initialList: [
      { value: "67", address: "c4k" },
      { value: "54", address: "m8n" },
      { value: "71", address: "p2q" },
    ],
    target: { type: "value", value: "54" },
    expectedStructure: [
      { value: "67", address: "c4k" },
      { value: "71", address: "p2q" },
    ],
    distractorCount: 3,
    difficulty: "medium",
  },
  level_3: {
    id: "level_3",
    name: "Level 3: Delete Tail",
    description: "Delete the tail node of the list",
    initialList: [
      { value: "142", address: "x9z" },
      { value: "176", address: "r5t" },
      { value: "85", address: "h8j" },
    ],
    target: { type: "tail" },
    expectedStructure: [
      { value: "142", address: "x9z" },
      { value: "176", address: "r5t" },
    ],
    distractorCount: 4,
    difficulty: "hard",
  },
};

// Utility: Shuffle array
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Generate random distractor nodes (not in the list)
const generateDistractors = (count, existing) => {
  const existingKeys = new Set(existing.map((n) => `${n.value}-${n.address}`));
  const letters = "abcdefghijklmnopqrstuvwxyz".split("");
  const distractors = [];
  while (distractors.length < count) {
    const value = String(10 + Math.floor(Math.random() * 190));
    const address = `${letters[Math.floor(Math.random() * letters.length)]}${
      letters[Math.floor(Math.random() * letters.length)]
    }${Math.floor(Math.random() * 9) + 1}`;
    const key = `${value}-${address}`;
    if (!existingKeys.has(key)) {
      existingKeys.add(key);
      distractors.push({ value, address });
    }
  }
  return distractors;
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
      this.currentLevel = "level_1";
      return this._augmentExercise(this.exercises.level_1);
    }
    this.currentLevel = key;
    return this._augmentExercise(exercise);
  }

  // Compute and attach targetNode for convenience
  _augmentExercise(exercise) {
    const initialList = exercise.initialList;
    let targetNode = null;
    if (exercise.target.type === "head") {
      targetNode = initialList[0];
    } else if (exercise.target.type === "tail") {
      targetNode = initialList[initialList.length - 1];
    } else if (exercise.target.type === "value") {
      targetNode =
        initialList.find((n) => n.value === exercise.target.value) || null;
    }
    return { ...exercise, targetNode };
  }

  // Get all available exercises
  getAllExercises() {
    return Object.values(this.exercises).map((e) => this._augmentExercise(e));
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

  // Generate floating circles (as nodes) for a specific level
  // Output circle shape: { id, type: 'node', value, address, isInList, x,y,vx,vy }
  generateFloatingCircles(levelKey) {
    const exercise = this.exercises[levelKey];
    if (!exercise) return [];

    // Nodes in the list
    const listNodes = exercise.initialList.map((n, idx) => ({
      id: `node-${levelKey}-${idx}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}`,
      type: "node",
      value: n.value,
      address: n.address,
      isInList: true,
    }));

    // Distractors
    const distractorNodes = generateDistractors(
      exercise.distractorCount,
      exercise.initialList
    ).map((n, idx) => ({
      id: `distractor-${levelKey}-${idx}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}`,
      type: "node",
      value: n.value,
      address: n.address,
      isInList: false,
    }));

    // Combine and shuffle
    const nodes = shuffleArray([...listNodes, ...distractorNodes]);
    return nodes;
  }

  // Validate deletion
  // deletedNode: { value, address, isInList }
  validateDeletion(levelKey, deletedNode) {
    const exercise = this._augmentExercise(this.exercises[levelKey]);
    if (!exercise || !deletedNode) {
      return { isCorrect: false, message: "Invalid action", score: 0 };
    }

    const { target, targetNode } = exercise;

    let isCorrect = false;
    if (target.type === "head") {
      isCorrect =
        deletedNode.value === exercise.initialList[0].value &&
        deletedNode.address === exercise.initialList[0].address;
    } else if (target.type === "tail") {
      const tail = exercise.initialList[exercise.initialList.length - 1];
      isCorrect =
        deletedNode.value === tail.value &&
        deletedNode.address === tail.address;
    } else if (target.type === "value") {
      isCorrect =
        deletedNode.value === target.value && deletedNode.isInList === true;
    }

    const userAfterList = exercise.initialList
      .filter(
        (n) =>
          !(
            n.value === deletedNode.value &&
            n.address === deletedNode.address &&
            deletedNode.isInList
          )
      )
      .map((n) => ({ value: n.value, address: n.address }));

    return {
      isCorrect,
      message: isCorrect ? "Correct deletion" : "Incorrect node deleted",
      score: isCorrect ? 100 : 0,
      expectedStructure: exercise.expectedStructure,
      userCircles: userAfterList, // used by UI to render user's resulting list
      targetNode,
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
      percentage: ((currentIndex + 1) / levels.length) * 100,
    };
  }
}

// Export exercise definitions for use in other files if needed
export { exerciseDefinitions };
