// src/core/memoryStore.js

export const memoryStore = {
  state: {
    ledger: [],
    transport: []
  },

  getState() {
    return this.state;
  },

  persist(events) {
    for (const e of events) {
      if (e.type === 'LEDGER') {
        this.state.ledger.push(e);
      } else {
        this.state.transport.push(e);
      }
    }
  }
};