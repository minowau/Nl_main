import { Resource, LearningMap, LearningActivity } from '../types';

export const mockResources: Resource[] = [
  // Discrete Mathematics Resources with Subtopics
  { 
    id: '1', 
    position: { x: 0, y: 2 }, 
    type: 'book', 
    title: 'Propositional Logic', 
    subtopics: ['Truth Tables', 'Logical Operators', 'Tautologies', 'Contradictions', 'Logical Equivalence'],
    visited: false, 
    difficulty: 1, 
    reward: 50 
  },
  { 
    id: '2', 
    position: { x: 2, y: 1 }, 
    type: 'video', 
    title: 'Predicate Logic', 
    subtopics: ['Quantifiers', 'Predicates', 'Domain of Discourse', 'Nested Quantifiers', 'Logical Inference'],
    visited: false, 
    difficulty: 2, 
    reward: 60 
  },
  { 
    id: '3', 
    position: { x: 1, y: 4 }, 
    type: 'quiz', 
    title: 'Proof Strategies', 
    subtopics: ['Direct Proof', 'Proof by Contradiction', 'Mathematical Induction', 'Strong Induction', 'Proof by Cases'],
    visited: false, 
    difficulty: 3, 
    reward: 80 
  },
  { 
    id: '4', 
    position: { x: 4, y: 3 }, 
    type: 'assignment', 
    title: 'Sets and Relations', 
    subtopics: ['Set Operations', 'Venn Diagrams', 'Binary Relations', 'Reflexive Relations', 'Transitive Relations'],
    visited: false, 
    difficulty: 2, 
    reward: 70 
  },
  { 
    id: '5', 
    position: { x: 3, y: 5 }, 
    type: 'book', 
    title: 'Equivalence Relations', 
    subtopics: ['Equivalence Classes', 'Partitions', 'Quotient Sets', 'Congruence Relations', 'Modular Arithmetic'],
    visited: false, 
    difficulty: 3, 
    reward: 90 
  },
  { 
    id: '6', 
    position: { x: 5, y: 4 }, 
    type: 'video', 
    title: 'Partial Orderings', 
    subtopics: ['Posets', 'Hasse Diagrams', 'Maximal Elements', 'Minimal Elements', 'Lattices'],
    visited: false, 
    difficulty: 4, 
    reward: 100 
  },
  { 
    id: '7', 
    position: { x: 6, y: 6 }, 
    type: 'quiz', 
    title: 'Functions', 
    subtopics: ['Injective Functions', 'Surjective Functions', 'Bijective Functions', 'Inverse Functions', 'Composition'],
    visited: false, 
    difficulty: 3, 
    reward: 85 
  },
  { 
    id: '8', 
    position: { x: 7, y: 5 }, 
    type: 'book', 
    title: 'Combinatorics', 
    subtopics: ['Permutations', 'Combinations', 'Pigeonhole Principle', 'Inclusion-Exclusion', 'Generating Functions'],
    visited: false, 
    difficulty: 4, 
    reward: 120 
  },
  { 
    id: '9', 
    position: { x: 8, y: 7 }, 
    type: 'assignment', 
    title: 'Graph Theory', 
    subtopics: ['Graph Representation', 'Eulerian Paths', 'Hamiltonian Cycles', 'Tree Algorithms', 'Graph Coloring'],
    visited: false, 
    difficulty: 5, 
    reward: 150 
  },
  { 
    id: '10', 
    position: { x: 6, y: 8 }, 
    type: 'video', 
    title: 'Number Theory', 
    subtopics: ['Prime Numbers', 'GCD and LCM', 'Euclidean Algorithm', 'Modular Arithmetic', 'Chinese Remainder Theorem'],
    visited: false, 
    difficulty: 4, 
    reward: 110 
  },
  { 
    id: '11', 
    position: { x: 8, y: 8 }, 
    type: 'quiz', 
    title: 'Abstract Algebra', 
    subtopics: ['Groups', 'Rings', 'Fields', 'Homomorphisms', 'Isomorphisms'],
    visited: false, 
    difficulty: 5, 
    reward: 140 
  },
  { 
    id: '12', 
    position: { x: 9, y: 9 }, 
    type: 'book', 
    title: 'Discrete Probability', 
    subtopics: ['Sample Spaces', 'Conditional Probability', 'Bayes Theorem', 'Random Variables', 'Expected Value'],
    visited: false, 
    difficulty: 4, 
    reward: 130 
  }
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