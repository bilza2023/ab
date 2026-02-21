
import { CompanyStructure } from './company.js';
import { MMA } from './MMA.js';
import { memoryStore } from './memoryStore.js';

// 1. Create company structure
const company = new CompanyStructure();

// Add stations
company.addStation('ABS', 'Abs Plant');
company.addStation('PSS', 'Pss Plant');