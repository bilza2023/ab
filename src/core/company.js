// src/company/company.js

export class CompanyStructure {
    constructor() {
      this._stations = new Map();   // key: stationCode
      this._mmas = new Map();       // key: mmaCode
    }
  
    // -------------------------
    // Stations
    // -------------------------
  
    addStation(code, name) {
      if (!code) throw new Error('station code is required');
      if (this._stations.has(code)) {
        throw new Error(`Station already exists: ${code}`);
      }
  
      const station = { code, name: name || code };
      this._stations.set(code, station);
  
      return station;
    }
  
    getStation(code) {
      const station = this._stations.get(code);
      if (!station) throw new Error(`Unknown station: ${code}`);
      return station;
    }
  
    // -------------------------
    // MMAs
    // -------------------------
  
    addMMA(code, stationCode) {
      if (!code) throw new Error('mma code is required');
      if (!stationCode) throw new Error('stationCode is required');
  
      if (!this._stations.has(stationCode)) {
        throw new Error(`Cannot add MMA. Station does not exist: ${stationCode}`);
      }
  
      if (this._mmas.has(code)) {
        throw new Error(`MMA already exists: ${code}`);
      }
  
      const mma = {
        code,
        stationCode
      };
  
      this._mmas.set(code, mma);
  
      return mma;
    }
  
    getMMA(code) {
      const mma = this._mmas.get(code);
      if (!mma) throw new Error(`Unknown MMA: ${code}`);
      return mma;
    }
  
    // Optional helper (useful for UI later)
    getMMAsByStation(stationCode) {
      if (!this._stations.has(stationCode)) {
        throw new Error(`Unknown station: ${stationCode}`);
      }
  
      return [...this._mmas.values()].filter(
        mma => mma.stationCode === stationCode
      );
    }
  }