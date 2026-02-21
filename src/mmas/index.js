import { CompanyStructure } from '../core/company.js';
import { MMA } from '../core/MMA.js';
import { memoryStore } from '../core/memoryStore.js';

// Create company
export const company = new CompanyStructure();

// Stations
company.addStation('ABS', 'Abs Plant');
company.addStation('PSS', 'Pss Plant');

// MMAs
export const ABS_RAW = new MMA({
  code: 'ABS_RAW',
  stationCode: 'ABS',
  getState: () => memoryStore.getState(),
  persistEvents: (events) => memoryStore.persist(events)
});

export const PSS_SCREENED = new MMA({
  code: 'PSS_SCREENED',
  stationCode: 'PSS',
  getState: () => memoryStore.getState(),
  persistEvents: (events) => memoryStore.persist(events)
});