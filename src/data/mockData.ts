import { Resource, LearningMap, LearningActivity } from '../types';

export const mockResources: Resource[] = [
  { id: '1', position: { x: 5, y: 12 }, type: 'book', title: 'Pre training objectives', visited: false, difficulty: 2, reward: 60 },
  { id: '2', position: { x: 4, y: 12 }, type: 'video', title: 'Pre trained models', visited: false, difficulty: 2, reward: 65 },
  { id: '3', position: { x: 8, y: 9 }, type: 'quiz', title: 'Tutorial: Introduction to huggingface', visited: false, difficulty: 2, reward: 70 },
  { id: '4', position: { x: 9, y: 10 }, type: 'assignment', title: 'Fine tuning LLM', visited: false, difficulty: 3, reward: 80 },
  { id: '5', position: { x: 3, y: 14 }, type: 'book', title: 'Instruction tuning', visited: false, difficulty: 3, reward: 85 },
  { id: '6', position: { x: 2, y: 16 }, type: 'video', title: 'Prompt based learning', visited: false, difficulty: 2, reward: 75 },
  { id: '7', position: { x: 3, y: 15 }, type: 'quiz', title: 'Parameter efficient fine tuning', visited: false, difficulty: 3, reward: 90 },
  { id: '8', position: { x: 3, y: 16 }, type: 'book', title: 'Incontext Learning', visited: false, difficulty: 3, reward: 85 },
  { id: '9', position: { x: 4, y: 17 }, type: 'video', title: 'Prompting methods', visited: false, difficulty: 2, reward: 70 },
  { id: '10', position: { x: 6, y: 14 }, type: 'assignment', title: 'Retrieval Methods', visited: false, difficulty: 3, reward: 95 },
  { id: '11', position: { x: 2, y: 17 }, type: 'quiz', title: 'Retrieval Augmented Generation', visited: false, difficulty: 4, reward: 120 },
  { id: '12', position: { x: 14, y: 6 }, type: 'book', title: 'Quantization', visited: false, difficulty: 4, reward: 110 },
  { id: '13', position: { x: 9, y: 9 }, type: 'video', title: 'Mixture of Experts Model', visited: false, difficulty: 4, reward: 115 },
  { id: '14', position: { x: 5, y: 15 }, type: 'assignment', title: 'Agentic AI', visited: false, difficulty: 4, reward: 125 },
  { id: '15', position: { x: 7, y: 15 }, type: 'quiz', title: 'Multimodal LLMs', visited: false, difficulty: 4, reward: 130 },
  { id: '16', position: { x: 8, y: 12 }, type: 'book', title: 'Vision Language Models', visited: false, difficulty: 4, reward: 125 },
  { id: '17', position: { x: 9, y: 11 }, type: 'video', title: 'Policy learning using DQN', visited: false, difficulty: 5, reward: 150 },
  { id: '18', position: { x: 17, y: 3 }, type: 'assignment', title: 'RLHF', visited: false, difficulty: 5, reward: 160 },
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
