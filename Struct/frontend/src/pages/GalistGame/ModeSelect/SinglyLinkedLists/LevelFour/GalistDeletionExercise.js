// NodeDeletionExercise.js - Exercise definitions for Node Deletion levels

// Exercise data structure for three mini-levels (each has multiple deletion stages)
const exerciseDefinitions = {
  level_1: {
    id: "level_1",
    name: "Level 1: Progressive Deletion",
    description: "Delete nodes one by one through connections",
    initialList: [
      { value: "10", address: "ab7" },
      { value: "25", address: "x2c" },
      { value: "33", address: "f9d" },
      { value: "42", address: "k5m" },
      { value: "58", address: "p9r" },
    ],
    // Multi-stage format: each stage has a target and expected result after that deletion
    stages: [
      {
        target: { type: "head" }, // Stage 1: delete head (10) via adjacency of its next two nodes
        expectedStructure: [
          { value: "25", address: "x2c" },
          { value: "33", address: "f9d" },
          { value: "42", address: "k5m" },
          { value: "58", address: "p9r" },
        ],
      },
      {
        // Stage 2: delete middle node 33 by connecting 25 and 42 (distance > 1 deletes strictly between)
        target: { type: "value", value: "33" },
        expectedStructure: [
          { value: "25", address: "x2c" },
          { value: "42", address: "k5m" },
          { value: "58", address: "p9r" },
        ],
      },
      {
        // Stage 3: delete middle node 42 by connecting 25 and 58 (distance > 1 deletes 42)
        target: { type: "value", value: "42" },
        expectedStructure: [
          { value: "25", address: "x2c" },
          { value: "58", address: "p9r" },
        ],
      },
    ],
    difficulty: "easy",
  },
  level_2: {
    id: "level_2",
    name: "Level 2: Mixed Deletion",
    description: "Delete nodes using different strategies",
    initialList: [
      { value: "67", address: "c4k" },
      { value: "54", address: "m8n" },
      { value: "71", address: "p2q" },
      { value: "89", address: "t7v" },
      { value: "94", address: "w1x" },
      { value: "103", address: "z3a" },
    ],
    stages: [
      {
        target: { type: "value", value: "54" }, // Delete specific value first
        expectedStructure: [
          { value: "67", address: "c4k" },
          { value: "71", address: "p2q" },
          { value: "89", address: "t7v" },
          { value: "94", address: "w1x" },
          { value: "103", address: "z3a" },
        ],
      },
      {
        target: { type: "head" }, // Then delete head
        expectedStructure: [
          { value: "71", address: "p2q" },
          { value: "89", address: "t7v" },
          { value: "94", address: "w1x" },
          { value: "103", address: "z3a" },
        ],
      },
      {
        target: { type: "tail" }, // Finally delete tail
        expectedStructure: [
          { value: "71", address: "p2q" },
          { value: "89", address: "t7v" },
          { value: "94", address: "w1x" },
        ],
      },
    ],
    difficulty: "medium",
  },
  level_3: {
    id: "level_3",
    name: "Level 3: Advanced Deletion",
    description: "Master multiple deletion techniques",
    initialList: [
      { value: "142", address: "x9z" },
      { value: "176", address: "r5t" },
      { value: "85", address: "h8j" },
      { value: "127", address: "d2g" },
      { value: "199", address: "n6p" },
      { value: "234", address: "b4c" },
      { value: "156", address: "y8u" },
    ],
    stages: [
      {
        target: { type: "value", value: "85" }, // Delete middle value
        expectedStructure: [
          { value: "142", address: "x9z" },
          { value: "176", address: "r5t" },
          { value: "127", address: "d2g" },
          { value: "199", address: "n6p" },
          { value: "234", address: "b4c" },
          { value: "156", address: "y8u" },
        ],
      },
      {
        target: { type: "tail" }, // Delete tail
        expectedStructure: [
          { value: "142", address: "x9z" },
          { value: "176", address: "r5t" },
          { value: "127", address: "d2g" },
          { value: "199", address: "n6p" },
          { value: "234", address: "b4c" },
        ],
      },
      {
        target: { type: "head" }, // Delete head
        expectedStructure: [
          { value: "176", address: "r5t" },
          { value: "127", address: "d2g" },
          { value: "199", address: "n6p" },
          { value: "234", address: "b4c" },
        ],
      },
      {
        target: { type: "value", value: "199" }, // Delete another specific value
        expectedStructure: [
          { value: "176", address: "r5t" },
          { value: "127", address: "d2g" },
          { value: "234", address: "b4c" },
        ],
      },
    ],
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

// Exercise Manager class
export class ExerciseManager {
  constructor() {
    this.exercises = exerciseDefinitions;
    this.currentLevel = "level_1";
    this.currentStage = 0; // Track which stage of the current level
    this.deletedNodes = []; // Track nodes that have been deleted in current level
  }

  // Load exercise by key, optionally reset to specific stage
  loadExercise(key = "level_1", stage = 0) {
    const exercise = this.exercises[key];
    if (!exercise) {
      console.warn(`Exercise ${key} not found, loading level_1`);
      this.currentLevel = "level_1";
      this.currentStage = 0;
      this.deletedNodes = [];
      return this._augmentExercise(this.exercises.level_1, 0);
    }
    this.currentLevel = key;
    this.currentStage = Math.min(stage, exercise.stages.length - 1);
    if (stage === 0) {
      this.deletedNodes = []; // Reset deleted nodes when starting new level
    }
    return this._augmentExercise(exercise, this.currentStage);
  }

  // Compute and attach current target and expected structure based on stage
  _augmentExercise(exercise, stage) {
    if (!exercise.stages || exercise.stages.length === 0) {
      console.error("Exercise missing stages data");
      return exercise;
    }

    const currentStageData = exercise.stages[stage];
    if (!currentStageData) {
      console.error(`Stage ${stage} not found in exercise`);
      return exercise;
    }

    // Calculate remaining list after previous deletions
    let remainingList = exercise.initialList.filter(
      (node) =>
        !this.deletedNodes.some(
          (deleted) =>
            deleted.value === node.value && deleted.address === node.address
        )
    );

    // Determine target node based on current remaining list
    let targetNode = null;
    const target = currentStageData.target;

    if (target.type === "head" && remainingList.length > 0) {
      targetNode = remainingList[0];
    } else if (target.type === "tail" && remainingList.length > 0) {
      targetNode = remainingList[remainingList.length - 1];
    } else if (target.type === "value") {
      targetNode = remainingList.find((n) => n.value === target.value) || null;
    }

    return {
      ...exercise,
      targetNode,
      currentStage: stage,
      totalStages: exercise.stages.length,
      expectedStructure: currentStageData.expectedStructure,
      remainingList,
      isLastStage: stage >= exercise.stages.length - 1,
    };
  }

  // Advance to next stage after successful deletion
  advanceStage(deletedNode) {
    if (deletedNode) {
      this.deletedNodes.push({
        value: deletedNode.value,
        address: deletedNode.address,
      });
    }

    const exercise = this.exercises[this.currentLevel];
    if (exercise && this.currentStage < exercise.stages.length - 1) {
      this.currentStage++;
      return this._augmentExercise(exercise, this.currentStage);
    }
    return null; // No more stages
  }

  // Check if current stage is complete and advance if so
  validateAndAdvanceStage(playerLinkedList, targetNode) {
    const exercise = this.exercises[this.currentLevel];
    if (!exercise || !targetNode) return null;

    const currentStageData = exercise.stages[this.currentStage];
    if (!currentStageData) return null;

    // Check if target was successfully deleted and list matches expected structure
    const targetInList = playerLinkedList.some(
      (node) =>
        node.value === targetNode.value && node.address === targetNode.address
    );

    const structureMatches =
      playerLinkedList.length === currentStageData.expectedStructure.length &&
      playerLinkedList.every((playerNode, index) => {
        const expectedNode = currentStageData.expectedStructure[index];
        return (
          playerNode.value === expectedNode.value &&
          playerNode.address === expectedNode.address
        );
      });

    if (!targetInList && structureMatches) {
      // Stage completed successfully
      return this.advanceStage(targetNode);
    }

    return null; // Stage not yet complete
  }

  // Reset current level to stage 0
  resetLevel(levelKey = null) {
    const key = levelKey || this.currentLevel;
    this.currentStage = 0;
    this.deletedNodes = [];
    return this.loadExercise(key, 0);
  }

  // Get current stage progress info
  getStageProgress() {
    const exercise = this.exercises[this.currentLevel];
    if (!exercise) return null;

    return {
      currentStage: this.currentStage + 1,
      totalStages: exercise.stages.length,
      isLastStage: this.currentStage >= exercise.stages.length - 1,
      deletedNodesCount: this.deletedNodes.length,
    };
  }

  // Get all available exercises (for compatibility)
  getAllExercises() {
    return Object.values(this.exercises).map((e) =>
      this._augmentExercise(e, 0)
    );
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

    // Only nodes in the list - no distractors
    const listNodes = exercise.initialList.map((n, idx) => ({
      id: `node-${levelKey}-${idx}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}`,
      type: "node",
      value: n.value,
      address: n.address,
      isInList: true,
    }));

    // Return shuffled list nodes
    const nodes = shuffleArray([...listNodes]);
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
