const axios = require('axios');
const cache = require('../cache/cache');
// ── Inline Groq Key Pool ─────────────────────────────────────────────────────
const _groqKeys = [];
const _groqCooldowns = {};
let _groqIndex = 0;
(() => {
  if (process.env.GROQ_API_KEY) _groqKeys.push(process.env.GROQ_API_KEY);
  let i = 1;
  while (process.env[`GROQ_API_KEY_${i}`]) { _groqKeys.push(process.env[`GROQ_API_KEY_${i}`]); i++; }
  console.log(`Groq pool: ${_groqKeys.length} key(s) loaded`);
})();
const groqRequest = async (axios, prompt) => {
  if (_groqKeys.length === 0) throw new Error('No GROQ_API_KEY configured in .env');
  let lastErr;
  for (let attempt = 0; attempt < _groqKeys.length; attempt++) {
    const now = Date.now();
    const idx = (_groqIndex + attempt) % _groqKeys.length;
    const key = _groqKeys[idx];
    if ((_groqCooldowns[key] || 0) > now) continue;
    _groqIndex = (idx + 1) % _groqKeys.length;
    try {
      return await axios.post('https://api.groq.com/openai/v1/chat/completions',
        { model:'llama-3.3-70b-versatile', messages:[{role:'user',content:prompt}], temperature:0.65, max_tokens:8000 },
        { headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${key}` }, timeout:60000 }
      );
    } catch(err) {
      lastErr = err;
      if (err.response?.status === 429) { _groqCooldowns[key] = now + 65000; continue; }
      throw err;
    }
  }
  throw lastErr || new Error('All Groq keys rate limited. Wait 1 minute and try again.');
};
const { checkRoadmapLimit, incrementRoadmapCount, saveRoadmap } = require('../db/users');

// ══════════════════════════════════════════════════════════════════════════════
// MEGA PROBLEM BANK
// Sources: Blind 75, Grind 75, NeetCode 150, Striver SDE Sheet, Love Babbar,
//          TUF Sheet, company-tagged classics
// Tags: isBlind75, isNeetCode150, isGrind75, isStriver, isLoveBabbar
// ══════════════════════════════════════════════════════════════════════════════
const LC_PROBLEMS = {
  'arrays': [
    { id:1,   name:'Two Sum',                            diff:'Easy',   blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:217, name:'Contains Duplicate',                 diff:'Easy',   blind75:1, neet:1, grind:1, striver:0, babbar:1 },
    { id:238, name:'Product of Array Except Self',       diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:53,  name:'Maximum Subarray',                   diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:152, name:'Maximum Product Subarray',           diff:'Medium', blind75:1, neet:1, grind:0, striver:1, babbar:1 },
    { id:153, name:'Find Minimum in Rotated Sorted Array',diff:'Medium',blind75:1, neet:1, grind:1, striver:1, babbar:0 },
    { id:33,  name:'Search in Rotated Sorted Array',     diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:15,  name:'3Sum',                               diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:11,  name:'Container With Most Water',          diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:128, name:'Longest Consecutive Sequence',       diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:75,  name:'Sort Colors',                        diff:'Medium', blind75:0, neet:0, grind:1, striver:1, babbar:1 },
    { id:56,  name:'Merge Intervals',                    diff:'Medium', blind75:0, neet:1, grind:1, striver:1, babbar:1 },
    { id:169, name:'Majority Element',                   diff:'Easy',   blind75:0, neet:0, grind:1, striver:1, babbar:1 },
    { id:189, name:'Rotate Array',                       diff:'Medium', blind75:0, neet:0, grind:1, striver:1, babbar:1 },
    { id:48,  name:'Rotate Image',                       diff:'Medium', blind75:0, neet:1, grind:1, striver:1, babbar:1 },
    { id:73,  name:'Set Matrix Zeroes',                  diff:'Medium', blind75:0, neet:1, grind:0, striver:1, babbar:1 },
    { id:54,  name:'Spiral Matrix',                      diff:'Medium', blind75:0, neet:1, grind:1, striver:1, babbar:1 },
    { id:31,  name:'Next Permutation',                   diff:'Medium', blind75:0, neet:0, grind:0, striver:1, babbar:1 },
    { id:287, name:'Find the Duplicate Number',          diff:'Medium', blind75:0, neet:1, grind:1, striver:1, babbar:0 },
    { id:41,  name:'First Missing Positive',             diff:'Hard',   blind75:0, neet:1, grind:0, striver:1, babbar:1 },
  ],
  'two pointers': [
    { id:125, name:'Valid Palindrome',                   diff:'Easy',   blind75:1, neet:1, grind:1, striver:0, babbar:1 },
    { id:167, name:'Two Sum II - Input Array Is Sorted', diff:'Medium', blind75:0, neet:1, grind:1, striver:0, babbar:1 },
    { id:15,  name:'3Sum',                               diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:11,  name:'Container With Most Water',          diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:42,  name:'Trapping Rain Water',                diff:'Hard',   blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:283, name:'Move Zeroes',                        diff:'Easy',   blind75:0, neet:0, grind:1, striver:0, babbar:1 },
    { id:26,  name:'Remove Duplicates from Sorted Array',diff:'Easy',   blind75:0, neet:0, grind:1, striver:1, babbar:1 },
    { id:977, name:'Squares of a Sorted Array',          diff:'Easy',   blind75:0, neet:0, grind:1, striver:0, babbar:1 },
    { id:16,  name:'3Sum Closest',                       diff:'Medium', blind75:0, neet:0, grind:0, striver:0, babbar:1 },
    { id:18,  name:'4Sum',                               diff:'Medium', blind75:0, neet:0, grind:0, striver:1, babbar:1 },
  ],
  'sliding window': [
    { id:121, name:'Best Time to Buy and Sell Stock',    diff:'Easy',   blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:3,   name:'Longest Substring Without Repeating Characters', diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:424, name:'Longest Repeating Character Replacement', diff:'Medium', blind75:1, neet:1, grind:1, striver:0, babbar:0 },
    { id:76,  name:'Minimum Window Substring',           diff:'Hard',   blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:239, name:'Sliding Window Maximum',             diff:'Hard',   blind75:0, neet:1, grind:1, striver:1, babbar:1 },
    { id:567, name:'Permutation in String',              diff:'Medium', blind75:0, neet:1, grind:1, striver:0, babbar:0 },
    { id:209, name:'Minimum Size Subarray Sum',          diff:'Medium', blind75:0, neet:0, grind:1, striver:0, babbar:1 },
    { id:438, name:'Find All Anagrams in a String',      diff:'Medium', blind75:0, neet:0, grind:1, striver:0, babbar:1 },
    { id:904, name:'Fruit Into Baskets',                 diff:'Medium', blind75:0, neet:0, grind:0, striver:1, babbar:0 },
    { id:1004,name:'Max Consecutive Ones III',           diff:'Medium', blind75:0, neet:0, grind:1, striver:0, babbar:0 },
  ],
  'binary search': [
    { id:704, name:'Binary Search',                      diff:'Easy',   blind75:0, neet:1, grind:1, striver:1, babbar:1 },
    { id:74,  name:'Search a 2D Matrix',                 diff:'Medium', blind75:0, neet:1, grind:1, striver:1, babbar:1 },
    { id:875, name:'Koko Eating Bananas',                diff:'Medium', blind75:0, neet:1, grind:1, striver:0, babbar:0 },
    { id:153, name:'Find Minimum in Rotated Sorted Array',diff:'Medium',blind75:1, neet:1, grind:1, striver:1, babbar:0 },
    { id:33,  name:'Search in Rotated Sorted Array',     diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:981, name:'Time Based Key-Value Store',         diff:'Medium', blind75:0, neet:1, grind:0, striver:0, babbar:0 },
    { id:4,   name:'Median of Two Sorted Arrays',        diff:'Hard',   blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:34,  name:'Find First and Last Position of Element', diff:'Medium', blind75:0, neet:0, grind:1, striver:1, babbar:1 },
    { id:162, name:'Find Peak Element',                  diff:'Medium', blind75:0, neet:0, grind:1, striver:1, babbar:1 },
    { id:1283,name:'Find the Smallest Divisor',          diff:'Medium', blind75:0, neet:0, grind:0, striver:1, babbar:0 },
    { id:1011,name:'Capacity to Ship Packages',          diff:'Medium', blind75:0, neet:0, grind:0, striver:1, babbar:0 },
  ],
  'stack': [
    { id:20,  name:'Valid Parentheses',                  diff:'Easy',   blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:155, name:'Min Stack',                          diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:150, name:'Evaluate Reverse Polish Notation',   diff:'Medium', blind75:0, neet:1, grind:1, striver:0, babbar:1 },
    { id:22,  name:'Generate Parentheses',               diff:'Medium', blind75:0, neet:1, grind:1, striver:1, babbar:1 },
    { id:739, name:'Daily Temperatures',                 diff:'Medium', blind75:0, neet:1, grind:1, striver:1, babbar:1 },
    { id:853, name:'Car Fleet',                          diff:'Medium', blind75:0, neet:1, grind:0, striver:0, babbar:0 },
    { id:84,  name:'Largest Rectangle in Histogram',     diff:'Hard',   blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:85,  name:'Maximal Rectangle',                  diff:'Hard',   blind75:0, neet:0, grind:0, striver:0, babbar:1 },
    { id:496, name:'Next Greater Element I',             diff:'Easy',   blind75:0, neet:0, grind:1, striver:1, babbar:1 },
    { id:503, name:'Next Greater Element II',            diff:'Medium', blind75:0, neet:0, grind:0, striver:1, babbar:1 },
  ],
  'linked list': [
    { id:206, name:'Reverse Linked List',                diff:'Easy',   blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:21,  name:'Merge Two Sorted Lists',             diff:'Easy',   blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:141, name:'Linked List Cycle',                  diff:'Easy',   blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:143, name:'Reorder List',                       diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:19,  name:'Remove Nth Node From End of List',   diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:138, name:'Copy List with Random Pointer',      diff:'Medium', blind75:0, neet:1, grind:1, striver:1, babbar:1 },
    { id:2,   name:'Add Two Numbers',                    diff:'Medium', blind75:0, neet:1, grind:1, striver:1, babbar:1 },
    { id:287, name:'Find the Duplicate Number',          diff:'Medium', blind75:0, neet:1, grind:1, striver:1, babbar:0 },
    { id:146, name:'LRU Cache',                          diff:'Medium', blind75:0, neet:1, grind:1, striver:1, babbar:1 },
    { id:23,  name:'Merge K Sorted Lists',               diff:'Hard',   blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:25,  name:'Reverse Nodes in k-Group',           diff:'Hard',   blind75:0, neet:1, grind:0, striver:1, babbar:1 },
    { id:82,  name:'Remove Duplicates from Sorted List II', diff:'Medium', blind75:0, neet:0, grind:0, striver:1, babbar:1 },
  ],
  'trees': [
    { id:226, name:'Invert Binary Tree',                 diff:'Easy',   blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:104, name:'Maximum Depth of Binary Tree',       diff:'Easy',   blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:543, name:'Diameter of Binary Tree',            diff:'Easy',   blind75:0, neet:1, grind:1, striver:1, babbar:1 },
    { id:110, name:'Balanced Binary Tree',               diff:'Easy',   blind75:0, neet:1, grind:1, striver:1, babbar:1 },
    { id:100, name:'Same Tree',                          diff:'Easy',   blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:572, name:'Subtree of Another Tree',            diff:'Easy',   blind75:1, neet:1, grind:1, striver:0, babbar:1 },
    { id:235, name:'Lowest Common Ancestor of a BST',    diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:102, name:'Binary Tree Level Order Traversal',  diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:199, name:'Binary Tree Right Side View',        diff:'Medium', blind75:0, neet:1, grind:1, striver:1, babbar:1 },
    { id:1448,name:'Count Good Nodes in Binary Tree',    diff:'Medium', blind75:0, neet:1, grind:1, striver:0, babbar:0 },
    { id:98,  name:'Validate Binary Search Tree',        diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:230, name:'Kth Smallest Element in a BST',      diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:105, name:'Construct BT from Preorder+Inorder', diff:'Medium', blind75:0, neet:1, grind:1, striver:1, babbar:1 },
    { id:124, name:'Binary Tree Maximum Path Sum',       diff:'Hard',   blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:297, name:'Serialize and Deserialize Binary Tree',diff:'Hard', blind75:1, neet:1, grind:0, striver:1, babbar:1 },
    { id:236, name:'LCA of Binary Tree',                 diff:'Medium', blind75:0, neet:0, grind:1, striver:1, babbar:1 },
  ],
  'graphs': [
    { id:200, name:'Number of Islands',                  diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:133, name:'Clone Graph',                        diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:417, name:'Pacific Atlantic Water Flow',        diff:'Medium', blind75:1, neet:1, grind:1, striver:0, babbar:0 },
    { id:130, name:'Surrounded Regions',                 diff:'Medium', blind75:0, neet:1, grind:0, striver:1, babbar:1 },
    { id:207, name:'Course Schedule',                    diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:210, name:'Course Schedule II',                 diff:'Medium', blind75:0, neet:1, grind:1, striver:1, babbar:1 },
    { id:261, name:'Graph Valid Tree',                   diff:'Medium', blind75:1, neet:1, grind:0, striver:0, babbar:0 },
    { id:323, name:'Number of Connected Components',     diff:'Medium', blind75:1, neet:1, grind:0, striver:0, babbar:0 },
    { id:684, name:'Redundant Connection',               diff:'Medium', blind75:0, neet:1, grind:0, striver:0, babbar:0 },
    { id:127, name:'Word Ladder',                        diff:'Hard',   blind75:1, neet:1, grind:1, striver:0, babbar:1 },
    { id:695, name:'Max Area of Island',                 diff:'Medium', blind75:0, neet:1, grind:1, striver:1, babbar:1 },
    { id:994, name:'Rotting Oranges',                    diff:'Medium', blind75:0, neet:0, grind:1, striver:1, babbar:1 },
    { id:286, name:'Walls and Gates',                    diff:'Medium', blind75:0, neet:1, grind:0, striver:0, babbar:0 },
    { id:743, name:'Network Delay Time',                 diff:'Medium', blind75:0, neet:1, grind:0, striver:1, babbar:0 },
    { id:787, name:'Cheapest Flights Within K Stops',    diff:'Medium', blind75:0, neet:1, grind:0, striver:1, babbar:0 },
    { id:1091,name:'Shortest Path in Binary Matrix',     diff:'Medium', blind75:0, neet:0, grind:1, striver:0, babbar:0 },
  ],
  'dynamic programming': [
    { id:70,  name:'Climbing Stairs',                    diff:'Easy',   blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:746, name:'Min Cost Climbing Stairs',           diff:'Easy',   blind75:0, neet:1, grind:1, striver:0, babbar:1 },
    { id:198, name:'House Robber',                       diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:213, name:'House Robber II',                    diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:5,   name:'Longest Palindromic Substring',      diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:647, name:'Palindromic Substrings',             diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:0 },
    { id:91,  name:'Decode Ways',                        diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:322, name:'Coin Change',                        diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:152, name:'Maximum Product Subarray',           diff:'Medium', blind75:1, neet:1, grind:0, striver:1, babbar:1 },
    { id:139, name:'Word Break',                         diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:300, name:'Longest Increasing Subsequence',     diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:416, name:'Partition Equal Subset Sum',         diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:62,  name:'Unique Paths',                       diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:1143,name:'Longest Common Subsequence',         diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:309, name:'Best Time to Buy with Cooldown',     diff:'Medium', blind75:0, neet:1, grind:0, striver:1, babbar:0 },
    { id:518, name:'Coin Change II',                     diff:'Medium', blind75:0, neet:1, grind:1, striver:1, babbar:1 },
    { id:494, name:'Target Sum',                         diff:'Medium', blind75:0, neet:1, grind:0, striver:1, babbar:1 },
    { id:10,  name:'Regular Expression Matching',        diff:'Hard',   blind75:1, neet:1, grind:0, striver:1, babbar:1 },
    { id:72,  name:'Edit Distance',                      diff:'Hard',   blind75:0, neet:1, grind:1, striver:1, babbar:1 },
    { id:115, name:'Distinct Subsequences',              diff:'Hard',   blind75:0, neet:1, grind:0, striver:1, babbar:0 },
    { id:312, name:'Burst Balloons',                     diff:'Hard',   blind75:0, neet:1, grind:0, striver:0, babbar:0 },
    { id:32,  name:'Longest Valid Parentheses',          diff:'Hard',   blind75:0, neet:0, grind:0, striver:1, babbar:1 },
  ],
  'backtracking': [
    { id:39,  name:'Combination Sum',                    diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:40,  name:'Combination Sum II',                 diff:'Medium', blind75:0, neet:1, grind:0, striver:1, babbar:1 },
    { id:79,  name:'Word Search',                        diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:46,  name:'Permutations',                       diff:'Medium', blind75:0, neet:1, grind:1, striver:1, babbar:1 },
    { id:47,  name:'Permutations II',                    diff:'Medium', blind75:0, neet:0, grind:0, striver:1, babbar:1 },
    { id:78,  name:'Subsets',                            diff:'Medium', blind75:0, neet:1, grind:1, striver:1, babbar:1 },
    { id:90,  name:'Subsets II',                         diff:'Medium', blind75:0, neet:1, grind:0, striver:1, babbar:1 },
    { id:131, name:'Palindrome Partitioning',            diff:'Medium', blind75:0, neet:1, grind:1, striver:1, babbar:1 },
    { id:17,  name:'Letter Combinations of Phone Number',diff:'Medium', blind75:0, neet:1, grind:1, striver:1, babbar:1 },
    { id:51,  name:'N-Queens',                           diff:'Hard',   blind75:0, neet:1, grind:0, striver:1, babbar:1 },
    { id:37,  name:'Sudoku Solver',                      diff:'Hard',   blind75:0, neet:0, grind:0, striver:1, babbar:1 },
  ],
  'heap / priority queue': [
    { id:703, name:'Kth Largest Element in a Stream',    diff:'Easy',   blind75:0, neet:1, grind:1, striver:0, babbar:1 },
    { id:1046,name:'Last Stone Weight',                  diff:'Easy',   blind75:0, neet:1, grind:1, striver:0, babbar:0 },
    { id:973, name:'K Closest Points to Origin',         diff:'Medium', blind75:0, neet:1, grind:1, striver:1, babbar:1 },
    { id:215, name:'Kth Largest Element in an Array',    diff:'Medium', blind75:0, neet:1, grind:1, striver:1, babbar:1 },
    { id:347, name:'Top K Frequent Elements',            diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:295, name:'Find Median from Data Stream',       diff:'Hard',   blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:355, name:'Design Twitter',                     diff:'Medium', blind75:0, neet:1, grind:0, striver:0, babbar:0 },
    { id:621, name:'Task Scheduler',                     diff:'Medium', blind75:0, neet:1, grind:1, striver:1, babbar:1 },
    { id:23,  name:'Merge K Sorted Lists',               diff:'Hard',   blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:632, name:'Smallest Range Covering Elements',   diff:'Hard',   blind75:0, neet:0, grind:0, striver:0, babbar:1 },
  ],
  'intervals': [
    { id:252, name:'Meeting Rooms',                      diff:'Easy',   blind75:1, neet:1, grind:0, striver:0, babbar:0 },
    { id:253, name:'Meeting Rooms II',                   diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:57,  name:'Insert Interval',                    diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:56,  name:'Merge Intervals',                    diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:435, name:'Non-overlapping Intervals',          diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:986, name:'Interval List Intersections',        diff:'Medium', blind75:0, neet:0, grind:0, striver:1, babbar:0 },
    { id:1851,name:'Minimum Interval to Include Each Query',diff:'Hard',blind75:0, neet:1, grind:0, striver:0, babbar:0 },
  ],
  'greedy': [
    { id:53,  name:'Maximum Subarray',                   diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:55,  name:'Jump Game',                          diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:45,  name:'Jump Game II',                       diff:'Medium', blind75:0, neet:1, grind:1, striver:1, babbar:1 },
    { id:134, name:'Gas Station',                        diff:'Medium', blind75:0, neet:1, grind:0, striver:1, babbar:1 },
    { id:846, name:'Hand of Straights',                  diff:'Medium', blind75:0, neet:1, grind:0, striver:0, babbar:0 },
    { id:1899,name:'Merge Triplets to Form Target',      diff:'Medium', blind75:0, neet:1, grind:0, striver:0, babbar:0 },
    { id:763, name:'Partition Labels',                   diff:'Medium', blind75:0, neet:1, grind:1, striver:1, babbar:0 },
    { id:678, name:'Valid Parenthesis String',           diff:'Medium', blind75:0, neet:1, grind:0, striver:1, babbar:0 },
    { id:135, name:'Candy',                              diff:'Hard',   blind75:0, neet:0, grind:0, striver:1, babbar:1 },
  ],
  'hashing': [
    { id:1,   name:'Two Sum',                            diff:'Easy',   blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:49,  name:'Group Anagrams',                     diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:128, name:'Longest Consecutive Sequence',       diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:242, name:'Valid Anagram',                      diff:'Easy',   blind75:1, neet:1, grind:1, striver:0, babbar:1 },
    { id:36,  name:'Valid Sudoku',                       diff:'Medium', blind75:0, neet:1, grind:1, striver:0, babbar:0 },
    { id:383, name:'Ransom Note',                        diff:'Easy',   blind75:0, neet:0, grind:1, striver:0, babbar:0 },
    { id:202, name:'Happy Number',                       diff:'Easy',   blind75:0, neet:0, grind:1, striver:0, babbar:0 },
    { id:205, name:'Isomorphic Strings',                 diff:'Easy',   blind75:0, neet:0, grind:1, striver:0, babbar:1 },
    { id:290, name:'Word Pattern',                       diff:'Easy',   blind75:0, neet:0, grind:1, striver:0, babbar:0 },
  ],
  'strings': [
    { id:242, name:'Valid Anagram',                      diff:'Easy',   blind75:1, neet:1, grind:1, striver:0, babbar:1 },
    { id:125, name:'Valid Palindrome',                   diff:'Easy',   blind75:1, neet:1, grind:1, striver:0, babbar:1 },
    { id:49,  name:'Group Anagrams',                     diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:271, name:'Encode and Decode Strings',          diff:'Medium', blind75:1, neet:1, grind:0, striver:0, babbar:0 },
    { id:647, name:'Palindromic Substrings',             diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:0 },
    { id:5,   name:'Longest Palindromic Substring',      diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:28,  name:'Find the Index of the First Occurrence', diff:'Easy', blind75:0, neet:0, grind:1, striver:1, babbar:1 },
    { id:14,  name:'Longest Common Prefix',              diff:'Easy',   blind75:0, neet:0, grind:1, striver:0, babbar:1 },
    { id:844, name:'Backspace String Compare',           diff:'Easy',   blind75:0, neet:0, grind:1, striver:0, babbar:0 },
    { id:151, name:'Reverse Words in a String',          diff:'Medium', blind75:0, neet:0, grind:0, striver:1, babbar:1 },
  ],
  'math & bit manipulation': [
    { id:191, name:'Number of 1 Bits',                   diff:'Easy',   blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:338, name:'Counting Bits',                      diff:'Easy',   blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:268, name:'Missing Number',                     diff:'Easy',   blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:190, name:'Reverse Bits',                       diff:'Easy',   blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:371, name:'Sum of Two Integers',                diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:0 },
    { id:7,   name:'Reverse Integer',                    diff:'Medium', blind75:0, neet:0, grind:1, striver:1, babbar:1 },
    { id:136, name:'Single Number',                      diff:'Easy',   blind75:0, neet:0, grind:1, striver:1, babbar:1 },
    { id:231, name:'Power of Two',                       diff:'Easy',   blind75:0, neet:0, grind:1, striver:1, babbar:1 },
    { id:50,  name:'Pow(x, n)',                          diff:'Medium', blind75:0, neet:0, grind:1, striver:1, babbar:1 },
    { id:43,  name:'Multiply Strings',                   diff:'Medium', blind75:0, neet:0, grind:0, striver:1, babbar:1 },
    { id:2013,name:'Detect Squares',                     diff:'Medium', blind75:0, neet:1, grind:0, striver:0, babbar:0 },
  ],
  'trie': [
    { id:208, name:'Implement Trie (Prefix Tree)',        diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:211, name:'Design Add and Search Words',         diff:'Medium', blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:212, name:'Word Search II',                     diff:'Hard',   blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:14,  name:'Longest Common Prefix',              diff:'Easy',   blind75:0, neet:0, grind:1, striver:0, babbar:1 },
    { id:648, name:'Replace Words',                      diff:'Medium', blind75:0, neet:0, grind:0, striver:0, babbar:1 },
  ],
  'recursion': [
    { id:509, name:'Fibonacci Number',                   diff:'Easy',   blind75:0, neet:0, grind:1, striver:1, babbar:1 },
    { id:206, name:'Reverse Linked List',                diff:'Easy',   blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:344, name:'Reverse String',                     diff:'Easy',   blind75:0, neet:0, grind:0, striver:1, babbar:1 },
    { id:21,  name:'Merge Two Sorted Lists',             diff:'Easy',   blind75:1, neet:1, grind:1, striver:1, babbar:1 },
    { id:50,  name:'Pow(x, n)',                          diff:'Medium', blind75:0, neet:0, grind:1, striver:1, babbar:1 },
    { id:779, name:'K-th Symbol in Grammar',             diff:'Medium', blind75:0, neet:0, grind:0, striver:1, babbar:0 },
    { id:395, name:'Longest Substring with At Least K Repeating', diff:'Medium', blind75:0, neet:0, grind:0, striver:0, babbar:1 },
  ],
  'sorting': [
    { id:912, name:'Sort an Array',                      diff:'Medium', blind75:0, neet:0, grind:0, striver:1, babbar:1 },
    { id:75,  name:'Sort Colors',                        diff:'Medium', blind75:0, neet:0, grind:1, striver:1, babbar:1 },
    { id:215, name:'Kth Largest Element in an Array',    diff:'Medium', blind75:0, neet:1, grind:1, striver:1, babbar:1 },
    { id:179, name:'Largest Number',                     diff:'Medium', blind75:0, neet:0, grind:1, striver:1, babbar:1 },
    { id:315, name:'Count of Smaller Numbers After Self',diff:'Hard',   blind75:0, neet:0, grind:0, striver:0, babbar:1 },
    { id:493, name:'Reverse Pairs',                      diff:'Hard',   blind75:0, neet:0, grind:0, striver:1, babbar:1 },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// TOPIC ALIAS MAP
// ─────────────────────────────────────────────────────────────────────────────
const TOPIC_ALIAS = {
  'array':'arrays','arrays':'arrays','matrix':'arrays',
  'two pointer':'two pointers','two pointers':'two pointers','pointers':'two pointers',
  'sliding window':'sliding window','window':'sliding window',
  'binary search':'binary search','search':'binary search',
  'stack':'stack','monotonic stack':'stack','monotonic':'stack',
  'linked list':'linked list','list':'linked list',
  'tree':'trees','trees':'trees','bst':'trees','binary tree':'trees','binary search tree':'trees',
  'graph':'graphs','graphs':'graphs','bfs':'graphs','dfs':'graphs','union find':'graphs',
  'dynamic programming':'dynamic programming','dp':'dynamic programming','memoization':'dynamic programming',
  'backtracking':'backtracking','recursion':'recursion',
  'heap':'heap / priority queue','priority queue':'heap / priority queue','min heap':'heap / priority queue',
  'interval':'intervals','intervals':'intervals','meeting rooms':'intervals',
  'greedy':'greedy','greedy algorithm':'greedy',
  'hash':'hashing','hashing':'hashing','hashmap':'hashing','hash table':'hashing',
  'string':'strings','strings':'strings','string manipulation':'strings',
  'math':'math & bit manipulation','bit':'math & bit manipulation','bit manipulation':'math & bit manipulation','bits':'math & bit manipulation',
  'trie':'trie','prefix tree':'trie',
  'sort':'sorting','sorting':'sorting','merge sort':'sorting','quick sort':'sorting',
};

const getProblemsForTopic = (topic, count = 4, userLevel = 'medium') => {
  const key = Object.entries(TOPIC_ALIAS).find(([k]) => topic.toLowerCase().includes(k))?.[1] || 'arrays';
  let pool = LC_PROBLEMS[key] || LC_PROBLEMS['arrays'];

  // Score each problem: prioritize by sheets + match difficulty to user level
  const score = p => {
    let s = 0;
    if (p.blind75) s += 5;
    if (p.neet)    s += 4;
    if (p.striver) s += 3;
    if (p.grind)   s += 3;
    if (p.babbar)  s += 2;
    // Bias difficulty by user level
    if (userLevel === 'beginner' && p.diff === 'Easy')   s += 3;
    if (userLevel === 'beginner' && p.diff === 'Medium') s += 1;
    if (userLevel === 'medium'   && p.diff === 'Medium') s += 3;
    if (userLevel === 'medium'   && p.diff === 'Hard')   s += 1;
    if (userLevel === 'advanced' && p.diff === 'Hard')   s += 3;
    if (userLevel === 'advanced' && p.diff === 'Medium') s += 2;
    return s;
  };

  return pool
    .sort((a, b) => score(b) - score(a))
    .slice(0, count)
    .map(p => ({
      ...p,
      sheets: [
        p.blind75 && 'Blind 75',
        p.neet    && 'NeetCode 150',
        p.striver && 'Striver SDE',
        p.grind   && 'Grind 75',
        p.babbar  && 'Love Babbar',
      ].filter(Boolean),
      link: `https://leetcode.com/problems/${p.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}/`
    }));
};

// ─────────────────────────────────────────────────────────────────────────────
// DETERMINE USER LEVEL
// ─────────────────────────────────────────────────────────────────────────────
const getUserLevel = (solved, cfRating) => {
  const total = solved?.total || 0;
  const easy = solved?.easy || 0;
  const medium = solved?.medium || 0;
  const hard = solved?.hard || 0;

  // Absolute beginner — barely started
  if (total < 10) return 'absolute_beginner';
  // Beginner — mostly easy, few mediums
  if (total < 50 || (medium < 10 && hard === 0)) return 'beginner';
  // Early intermediate — doing mediums
  if (total < 150 || (medium < 50 && hard < 5)) return 'early_intermediate';
  // Intermediate — comfortable with mediums
  if (total < 300 || hard < 20) return 'intermediate';
  // Advanced — doing hard problems
  if (cfRating >= 1800 || total >= 400 || hard >= 50) return 'advanced';
  return 'intermediate';
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────
const getLCRoadmap = async (req, res) => {
  try {
    const { handle } = req.params;
    const { duration = 30, cfHandle = '', cfRating = 0 } = req.query;

    // ── Check daily limit ────────────────────────────────────────────────────
    if (req.user) {
      const limit = checkRoadmapLimit(req.user.id);
      if (limit.remaining <= 0) {
        return res.status(429).json({
          error: 'Daily roadmap limit reached (2/day). Come back tomorrow!',
          limitReached: true, limit: 2, remaining: 0
        });
      }
    }

    const cacheKey = `lc_roadmap_v5_${handle}_${duration}_${cfHandle}`;
    if (cache.has(cacheKey)) return res.json(cache.get(cacheKey));

    // ── Fetch LC stats ────────────────────────────────────────────────────────
    const lcRes = await axios.post('https://leetcode.com/graphql', {
      query: `query($username: String!) {
        matchedUser(username: $username) {
          username
          profile { ranking userAvatar }
          submitStats { acSubmissionNum { difficulty count } }
          tagProblemCounts {
            advanced { tagName problemsSolved }
            intermediate { tagName problemsSolved }
            fundamental { tagName problemsSolved }
          }
        }
        allQuestionsCount { difficulty count }
      }`,
      variables: { username: handle }
    }, { headers: { 'Content-Type': 'application/json', 'Referer': 'https://leetcode.com', 'User-Agent': 'Mozilla/5.0' } });

    const lcUser = lcRes.data.data?.matchedUser;
    if (!lcUser) throw new Error(`LeetCode user "${handle}" not found`);

    const acStats = lcUser.submitStats.acSubmissionNum;
    const solved = {
      easy:   acStats.find(s => s.difficulty === 'Easy')?.count   || 0,
      medium: acStats.find(s => s.difficulty === 'Medium')?.count || 0,
      hard:   acStats.find(s => s.difficulty === 'Hard')?.count   || 0,
      total:  acStats.find(s => s.difficulty === 'All')?.count    || 0,
    };

    // ── Deep tag-level analysis ───────────────────────────────────────────────
    const allTags = [
      ...(lcUser.tagProblemCounts?.fundamental  || []),
      ...(lcUser.tagProblemCounts?.intermediate || []),
      ...(lcUser.tagProblemCounts?.advanced     || []),
    ];

    const strongTags = [...allTags].sort((a,b) => b.problemsSolved - a.problemsSolved).slice(0,6);
    const weakTags   = [...allTags].filter(t => t.problemsSolved > 0 && t.problemsSolved < 5).slice(0,6);
    const neverTried = ['Dynamic Programming','Graph','Tree','Binary Search','Backtracking','Heap (Priority Queue)','Trie','Union Find']
      .filter(t => !allTags.find(a => a.tagName === t && a.problemsSolved > 0));

    const userLevel = getUserLevel(solved, Number(cfRating));
    const ranking   = lcUser.profile.ranking;

    // Ratio analysis
    const easyMedRatio = solved.medium > 0 ? (solved.easy / solved.medium).toFixed(1) : '∞';
    const medHardRatio = solved.hard > 0 ? (solved.medium / solved.hard).toFixed(1) : '∞';
    const medPct = solved.total > 0 ? Math.round((solved.medium / solved.total) * 100) : 0;
    const hardPct = solved.total > 0 ? Math.round((solved.hard / solved.total) * 100) : 0;

    // ── Level config ──────────────────────────────────────────────────────────
    const levelConfigs = {
      absolute_beginner: {
        label: '🌱 Absolute Beginner',
        difficulty: 'Easy ONLY — absolutely no Medium or Hard',
        topics: 'arrays, strings, hashing, two pointers, sorting, recursion basics',
        forbidden: 'graphs, dynamic programming, trees, backtracking, trie, heap, binary search — ALL FORBIDDEN',
        daily: '2 Easy problems per day max',
        note: 'ZERO medium or hard problems in the entire roadmap',
      },
      beginner: {
        label: '🌿 Beginner',
        difficulty: 'Easy (80%), first Medium only in week 3-4',
        topics: 'arrays, strings, hashing, two pointers, sorting, stack basics',
        forbidden: 'graphs, dynamic programming, backtracking, trie — forbidden until week 3',
        daily: '2 problems per day (mostly Easy)',
        note: 'No medium before week 3. No graphs/DP at all.',
      },
      early_intermediate: {
        label: '📈 Early Intermediate',
        difficulty: 'Easy (30%) and Medium (60%), tiny bit of Hard (10%)',
        topics: 'arrays, strings, hashing, two pointers, binary search, stack, linked list, trees, sliding window, greedy',
        forbidden: 'advanced DP patterns, complex graphs — introduce slowly week 2+',
        daily: '2-3 problems mostly Medium',
        note: 'Introduce graphs and DP in week 2 starting with Easy versions',
      },
      intermediate: {
        label: '⚡ Intermediate',
        difficulty: 'Medium (60%), Hard (30%), Easy (10%)',
        topics: 'all topics including graphs, dp, backtracking, heap, trie',
        forbidden: 'none',
        daily: '2-3 problems Medium+Hard',
        note: 'Push into Hard problems on weak topics',
      },
      advanced: {
        label: '🔥 Advanced',
        difficulty: 'Hard (50%), Medium (40%), Easy (10%)',
        topics: 'all topics, hardest variants',
        forbidden: 'none',
        daily: '2-3 Hard problems',
        note: 'Optimize, explain, mock interviews',
      },
    };
    const lvl = levelConfigs[userLevel] || levelConfigs.beginner;

    // ── STRICTLY LEVEL-AWARE PROMPT ───────────────────────────────────────────
    const prompt = `You are a senior DSA coach. Generate a STRICTLY PERSONALIZED ${duration}-day LeetCode roadmap.

╔══ USER STATS — READ CAREFULLY ══╗
Handle: ${handle} | Rank: #${ranking?.toLocaleString() || 'N/A'}
Solved: ${solved.easy} Easy + ${solved.medium} Medium + ${solved.hard} Hard = ${solved.total} Total
Level: ${lvl.label}
╚═════════════════════════════════╝

╔══ STRONG TOPICS (already good — skip or minimize) ══╗
${strongTags.map(t => `  ${t.tagName}: ${t.problemsSolved} solved`).join('\n') || '  none yet'}
╚═════════════════════════════════════════════════════╝

╔══ WEAK / NEVER TRIED (prioritize!) ══╗
${weakTags.map(t => `  ${t.tagName}: only ${t.problemsSolved}`).join('\n') || '  none'}
Never tried: ${neverTried.join(', ') || 'none'}
╚═══════════════════════════════════════╝

${cfHandle ? `CF: ${cfHandle} rating ${cfRating} — ${Number(cfRating) >= 1600 ? 'strong algo thinker' : Number(cfRating) >= 1000 ? 'some algo base' : 'early stage'}` : ''}

╔══ STRICT LEVEL RULES — NO EXCEPTIONS ══╗
DIFFICULTY ALLOWED: ${lvl.difficulty}
TOPICS ALLOWED: ${lvl.topics}
TOPICS FORBIDDEN: ${lvl.forbidden}
DAILY TARGET: ${lvl.daily}
RULE: ${lvl.note}

ENFORCEMENT:
- ${solved.total} total problems means ${userLevel === 'absolute_beginner' ? 'COMPLETE BEGINNER — Easy arrays and strings ONLY for all weeks' : userLevel === 'beginner' ? 'BEGINNER — Easy first 2 weeks, first Medium only in week 3' : userLevel === 'early_intermediate' ? 'EARLY INTERMEDIATE — mix Easy/Medium, intro graphs/DP slowly' : 'INTERMEDIATE+ — Medium/Hard appropriate'}
- ${solved.medium === 0 ? 'ZERO mediums solved: DO NOT suggest Medium until week 3 minimum' : solved.medium < 10 ? 'Very few mediums: introduce Medium slowly only on familiar topics' : 'Medium problems appropriate'}
- ${solved.hard === 0 ? 'ZERO hards solved: NO hard problems in this roadmap' : 'Some hard experience OK'}
- Every topic MUST be from the ALLOWED list. FORBIDDEN topics cannot appear.
╚═════════════════════════════════════════╝

Generate ALL ${Math.ceil(Number(duration)/7)} weeks. Raw JSON only, no markdown, no backticks.

{
  "summary": "3-4 sentences: ${handle} has ${solved.total} problems (${solved.easy} easy, ${solved.medium} medium, ${solved.hard} hard), what level this is, what the roadmap focuses on, why it starts where it does",
  "targetProblems": ${solved.total + Math.round(Number(duration) * 1.5)},
  "focusArea": "${userLevel === 'absolute_beginner' || userLevel === 'beginner' ? 'Easy problem fluency and pattern recognition foundations' : userLevel === 'early_intermediate' ? 'Medium problem patterns and systematic topic coverage' : 'Medium-Hard mastery and interview readiness'}",
  "personalizedInsights": {
    "profileAnalysis": "what ${solved.easy}E/${solved.medium}M/${solved.hard}H ratio says about this user specifically",
    "criticalGap": "biggest gap for someone with exactly ${solved.total} problems at ${lvl.label} level",
    "quickWin": "most achievable improvement this week for ${lvl.label}",
    "interviewReadiness": "honest: ${solved.total} problems — how far from interview ready and what milestone to aim for"
  },
  "milestones": [
    { "week": 1, "goal": "week 1 goal for ${lvl.label} user — must be achievable", "metric": "number" },
    { "week": ${Math.ceil(Number(duration)/14)}, "goal": "mid goal", "metric": "number" },
    { "week": ${Math.ceil(Number(duration)/7)}, "goal": "end goal", "metric": "number" }
  ],
  "weeks": [
    {
      "week": 1,
      "theme": "must use ALLOWED topics only: ${lvl.topics.split(',')[0].trim()} focus",
      "focus": "week 1 plan for ${solved.total} total problems solved user",
      "days": [
        { "day": 1, "topic": "${lvl.topics.split(',')[0].trim()}", "goal": "Solve 2 easy ${lvl.topics.split(',')[0].trim()} problems — you have ${solved.easy} easy so far, let's add 2 more", "pattern": "simple iteration pattern", "concepts": ["basic ${lvl.topics.split(',')[0].trim()}"], "difficulty": "${userLevel === 'absolute_beginner' || userLevel === 'beginner' ? 'Easy' : 'Easy'}", "whyToday": "Starting with ${lvl.topics.split(',')[0].trim()} because it is the most fundamental topic for someone at your level with ${solved.total} problems", "tip": "Read the problem twice before coding. Start with brute force." },
        { "day": 2, "topic": "${lvl.topics.split(',')[0].trim()}", "goal": "2 easy problems", "pattern": "two pointer on array", "concepts": ["array traversal"], "difficulty": "${userLevel === 'absolute_beginner' || userLevel === 'beginner' ? 'Easy' : 'Easy'}", "whyToday": "building array intuition", "tip": "Draw out the array on paper first" },
        { "day": 3, "topic": "${lvl.topics.split(',').length > 1 ? lvl.topics.split(',')[1].trim() : lvl.topics.split(',')[0].trim()}", "goal": "2 easy problems", "pattern": "character frequency map", "concepts": ["strings"], "difficulty": "Easy", "whyToday": "strings are fundamental", "tip": "Use a hashmap to count characters" },
        { "day": 4, "topic": "${lvl.topics.split(',')[0].trim()}", "goal": "2 easy problems", "pattern": "prefix sum", "concepts": ["running sum"], "difficulty": "Easy", "whyToday": "prefix sum is used everywhere", "tip": "Think about cumulative sums" },
        { "day": 5, "topic": "hashing", "goal": "2 easy hashing problems", "pattern": "hashmap lookup", "concepts": ["dictionary", "key-value"], "difficulty": "Easy", "whyToday": "hashing makes O(n) solutions", "tip": "When you need fast lookup, think hashmap" },
        { "day": 6, "topic": "${lvl.topics.split(',')[0].trim()}", "goal": "review + 1 new problem", "pattern": "sliding window fixed size", "concepts": ["window"], "difficulty": "Easy", "whyToday": "consolidate week learnings", "tip": "Review your week 1 solutions today" },
        { "day": 7, "topic": "${lvl.topics.split(',')[0].trim()}", "goal": "2 problems + review", "pattern": "two pointers", "concepts": ["left right pointers"], "difficulty": "Easy", "whyToday": "end of week review", "tip": "Can you solve yesterday's problem faster?" }
      ]
    },
    { "week": 2, "theme": "expanding foundations", "focus": "continue with allowed topics, build patterns", "days": [
      { "day": 8, "topic": "${lvl.topics.split(',').length > 2 ? lvl.topics.split(',')[2].trim() : 'hashing'}", "goal": "2 problems", "pattern": "frequency count", "concepts": ["hashing"], "difficulty": "${userLevel === 'absolute_beginner' || userLevel === 'beginner' ? 'Easy' : 'Easy or Medium'}", "whyToday": "expanding to new allowed topic", "tip": "tip" },
      { "day": 9, "topic": "two pointers", "goal": "2 easy two-pointer problems", "pattern": "two pointers converging", "concepts": ["left right"], "difficulty": "Easy", "whyToday": "two pointers is essential pattern", "tip": "tip" },
      { "day": 10, "topic": "strings", "goal": "2 string problems", "pattern": "string manipulation", "concepts": ["string ops"], "difficulty": "Easy", "whyToday": "strings appear in every interview", "tip": "tip" },
      { "day": 11, "topic": "arrays", "goal": "2 problems", "pattern": "prefix sum", "concepts": ["cumulative"], "difficulty": "Easy", "whyToday": "reinforcing arrays", "tip": "tip" },
      { "day": 12, "topic": "hashing", "goal": "2 hashing problems", "pattern": "complement lookup", "concepts": ["hash lookup"], "difficulty": "Easy", "whyToday": "hashing mastery", "tip": "tip" },
      { "day": 13, "topic": "sorting", "goal": "1-2 problems", "pattern": "sort then scan", "concepts": ["sorting"], "difficulty": "Easy", "whyToday": "sorting is fundamental", "tip": "tip" },
      { "day": 14, "topic": "arrays", "goal": "2 problems + week review", "pattern": "sliding window", "concepts": ["window"], "difficulty": "Easy", "whyToday": "week 2 review", "tip": "tip" }
    ]}
    CONTINUE FOR ALL ${Math.ceil(Number(duration)/7)} WEEKS TOTAL. Every week needs all 7 days. Topics MUST come from allowed list: ${lvl.topics}. ${userLevel === 'beginner' || userLevel === 'absolute_beginner' ? 'NO Medium problems until week 3 minimum. NO graphs, DP, trees, backtracking at all.' : ''}
  ],
  "motivation": "honest encouraging message for ${lvl.label} with ${solved.total} problems — mention the journey ahead and what they will achieve by end of ${duration} days"
}`;

    // ── Call Groq ─────────────────────────────────────────────────────────────
    const rawText = (await groqRequest(prompt)).replace(/```json|```/g, '').trim();
    const roadmap = JSON.parse(rawText);

    // ── Attach multi-sheet problems to each day ───────────────────────────────
    roadmap.weeks = roadmap.weeks.map(week => ({
      ...week,
      days: week.days.map(day => ({
        ...day,
        lcProblems: getProblemsForTopic(day.topic, 4, userLevel)
      }))
    }));

    // Track analytics
    try { require('../analytics/db').trackRoadmap(); } catch(e) {}

    const result = {
      handle, solved, ranking, userLevel, duration: Number(duration),
      strongTags: strongTags.map(t => t.tagName),
      weakTags: weakTags.map(t => t.tagName),
      neverTried,
      cfHandle: cfHandle || null, cfRating: Number(cfRating) || null,
      roadmap,
      generatedAt: new Date().toISOString()
    };

    cache.set(cacheKey, result, 1800);

    // ── Auto-save for logged-in users ─────────────────────────────────────────
    if (req.user) {
      try {
        incrementRoadmapCount(req.user.id);
        saveRoadmap(
          req.user.id, 'lc', handle, Number(duration),
          `${duration}-Day LC Roadmap (${lvl.label})`,
          roadmap.summary, roadmap.targetProblems, result
        );
      } catch(e) { console.error('Save error:', e.message); }
    }

    res.json(result);

  } catch (err) {
    console.error('LC Roadmap error:', err.response?.data || err.message);
    if (err.response?.status === 429 || err.message?.includes('rate limit') || err.message?.includes('rate limited')) return res.status(429).json({ error: err.message || 'All API keys rate limited. Try again in 1 minute.' });
    if (err instanceof SyntaxError) return res.status(500).json({ error: 'Failed to parse AI response. Try again.' });
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getLCRoadmap };
