import { Resource, LearningMap, LearningActivity } from '../types';

// Constant grid layout based on App.js - 10x10 grid with fixed resource positions
export const mockResources: Resource[] = [
  // Resources positioned in a 10x10 grid (coordinates 0-9)
  { id: '1', position: { x: 1, y: 8 }, type: 'book', title: 'Propositional Logic', visited: false, difficulty: 1, reward: 50 },
  { id: '2', position: { x: 3, y: 7 }, type: 'book', title: 'Predicate Logic', visited: false, difficulty: 2, reward: 60 },
  { id: '3', position: { x: 2, y: 6 }, type: 'book', title: 'Proof Strategies', visited: false, difficulty: 2, reward: 70 },
  { id: '4', position: { x: 4, y: 5 }, type: 'book', title: 'Sets and Relations', visited: false, difficulty: 3, reward: 80 },
  { id: '5', position: { x: 6, y: 4 }, type: 'book', title: 'Equivalence Relations', visited: false, difficulty: 3, reward: 90 },
  { id: '6', position: { x: 5, y: 3 }, type: 'book', title: 'Partitions', visited: false, difficulty: 3, reward: 85 },
  { id: '7', position: { x: 7, y: 2 }, type: 'book', title: 'Partial Orderings', visited: false, difficulty: 4, reward: 100 },
  { id: '8', position: { x: 8, y: 1 }, type: 'book', title: 'Theory of Countability', visited: false, difficulty: 4, reward: 110 },
  { id: '9', position: { x: 6, y: 7 }, type: 'book', title: 'Combinatorics', visited: false, difficulty: 4, reward: 120 },
  { id: '10', position: { x: 8, y: 6 }, type: 'book', title: 'Graph Theory', visited: false, difficulty: 5, reward: 130 },
  { id: '11', position: { x: 7, y: 8 }, type: 'book', title: 'Number Theory', visited: false, difficulty: 5, reward: 140 },
  { id: '12', position: { x: 9, y: 9 }, type: 'book', title: 'Abstract Algebra', visited: false, difficulty: 5, reward: 150 }
];

const learningActivities: LearningActivity[] = [
  {
    id: 'foundation',
    name: 'Programming Foundations',
    description: 'Learn basic programming concepts and syntax',
    completed: false,
    difficulty: 1,
    prerequisites: [],
    estimatedTime: '2-3 weeks'
  },
  {
    id: 'algorithms',
    name: 'Algorithms & Data Structures',
    description: 'Master fundamental algorithms and data structures',
    completed: false,
    difficulty: 2,
    prerequisites: ['foundation'],
    estimatedTime: '3-4 weeks'
  },
  {
    id: 'oop',
    name: 'Object-Oriented Programming',
    description: 'Understand OOP principles and design patterns',
    completed: false,
    difficulty: 3,
    prerequisites: ['foundation', 'algorithms'],
    estimatedTime: '2-3 weeks'
  },
  {
    id: 'web-dev',
    name: 'Web Development',
    description: 'Build modern web applications',
    completed: false,
    difficulty: 3,
    prerequisites: ['oop'],
    estimatedTime: '4-5 weeks'
  },
  {
    id: 'databases',
    name: 'Database Systems',
    description: 'Design and work with databases',
    completed: false,
    difficulty: 3,
    prerequisites: ['oop'],
    estimatedTime: '2-3 weeks'
  },
  {
    id: 'ml-basics',
    name: 'Machine Learning Fundamentals',
    description: 'Introduction to machine learning concepts',
    completed: false,
    difficulty: 4,
    prerequisites: ['algorithms', 'databases'],
    estimatedTime: '4-6 weeks'
  },
  {
    id: 'deep-learning',
    name: 'Deep Learning',
    description: 'Neural networks and deep learning techniques',
    completed: false,
    difficulty: 5,
    prerequisites: ['ml-basics'],
    estimatedTime: '6-8 weeks'
  },
  {
    id: 'reinforcement-learning',
    name: 'Reinforcement Learning',
    description: 'Advanced RL algorithms including DQN',
    completed: false,
    difficulty: 5,
    prerequisites: ['deep-learning'],
    estimatedTime: '4-6 weeks'
  }
];

export const mockLearningMap: LearningMap = {
  activities: learningActivities,
  currentActivity: 'foundation',
  progressPercentage: 12.5
};