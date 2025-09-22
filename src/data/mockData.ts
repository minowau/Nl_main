import { Resource, LearningMap, LearningActivity } from '../types';

export const mockResources: Resource[] = [
  // Beginner resources
  { id: '1', position: { x: 2, y: 18 }, type: 'book', title: 'Introduction to Programming', visited: false, difficulty: 1, reward: 50 },
  { id: '2', position: { x: 4, y: 16 }, type: 'video', title: 'Basic Algorithms', visited: false, difficulty: 1, reward: 40 },
  { id: '3', position: { x: 6, y: 14 }, type: 'quiz', title: 'Variables & Data Types', visited: false, difficulty: 1, reward: 30 },
  
  // Intermediate resources
  { id: '4', position: { x: 8, y: 12 }, type: 'assignment', title: 'Build a Calculator', visited: false, difficulty: 2, reward: 80 },
  { id: '5', position: { x: 10, y: 10 }, type: 'book', title: 'Object-Oriented Programming', visited: false, difficulty: 3, reward: 100 },
  { id: '6', position: { x: 12, y: 8 }, type: 'video', title: 'Design Patterns', visited: false, difficulty: 3, reward: 90 },
  { id: '7', position: { x: 14, y: 6 }, type: 'quiz', title: 'Advanced Data Structures', visited: false, difficulty: 4, reward: 120 },
  
  // Advanced resources - clustered area
  { id: '8', position: { x: 13, y: 4 }, type: 'book', title: 'Machine Learning Basics', visited: false, difficulty: 4, reward: 150 },
  { id: '9', position: { x: 14, y: 4 }, type: 'video', title: 'Neural Networks', visited: false, difficulty: 5, reward: 180 },
  { id: '10', position: { x: 15, y: 4 }, type: 'assignment', title: 'Build a CNN', visited: false, difficulty: 5, reward: 200 },
  { id: '11', position: { x: 13, y: 3 }, type: 'quiz', title: 'Deep Learning Assessment', visited: false, difficulty: 5, reward: 160 },
  { id: '12', position: { x: 14, y: 3 }, type: 'book', title: 'Advanced ML Techniques', visited: false, difficulty: 5, reward: 190 },
  { id: '13', position: { x: 15, y: 3 }, type: 'video', title: 'Reinforcement Learning', visited: false, difficulty: 5, reward: 220 },
  { id: '14', position: { x: 16, y: 4 }, type: 'assignment', title: 'DQN Implementation', visited: false, difficulty: 5, reward: 250 },
  { id: '15', position: { x: 16, y: 3 }, type: 'quiz', title: 'AI Ethics & Safety', visited: false, difficulty: 4, reward: 140 },
  
  // Scattered intermediate resources
  { id: '16', position: { x: 11, y: 6 }, type: 'book', title: 'Database Design', visited: false, difficulty: 3, reward: 110 },
  { id: '17', position: { x: 13, y: 8 }, type: 'video', title: 'Web Development', visited: false, difficulty: 2, reward: 70 },
  { id: '18', position: { x: 15, y: 10 }, type: 'assignment', title: 'Full-Stack Project', visited: false, difficulty: 4, reward: 170 },
  { id: '19', position: { x: 17, y: 12 }, type: 'quiz', title: 'System Design', visited: false, difficulty: 4, reward: 130 },
  { id: '20', position: { x: 18, y: 14 }, type: 'book', title: 'Cloud Computing', visited: false, difficulty: 3, reward: 100 },
  
  // Additional scattered resources
  { id: '21', position: { x: 9, y: 16 }, type: 'video', title: 'Git & Version Control', visited: false, difficulty: 2, reward: 60 },
  { id: '22', position: { x: 7, y: 18 }, type: 'quiz', title: 'Testing & Debugging', visited: false, difficulty: 2, reward: 50 },
  { id: '23', position: { x: 1, y: 16 }, type: 'book', title: 'Programming Fundamentals', visited: false, difficulty: 1, reward: 45 },
  { id: '24', position: { x: 3, y: 14 }, type: 'assignment', title: 'First Program', visited: false, difficulty: 1, reward: 35 },
  { id: '25', position: { x: 19, y: 16 }, type: 'video', title: 'Career in Tech', visited: false, difficulty: 1, reward: 40 }
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