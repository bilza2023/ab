

export const appData = {

  async suppliersList() {
    return prisma.supplier.findMany({ orderBy: { name: 'asc' } });
  },

  sizesList() {
    return ['Fine', 'Medium', 'Lumps'];
  },

  shadesList() {
    return ['White', 'Grey', 'Black', 'Mixed'];
  },

  mmaList() {
    return [
      'ABS_RAW',
      'ABS_SORTED',
      'ABS_SCREENED',

      'PSS_RAW',
      'PSS_SORTED',
      'PSS_SCREENED',
      
      'KEF_RAW',
      'KEF_SORTED',
      'KEF_SCREENED'
    ];
  },

  getLanes() {
    const families = {
      RAW: ['ABS_RAW','PSS_RAW','KEF_RAW'],
      SORTED: ['ABS_SORTED','PSS_SORTED','KEF_SORTED'],
      SCREENED: ['ABS_SCREENED','PSS_SCREENED','KEF_SCREENED']
    };

    const lanes = {};

    Object.values(families).forEach(group => {
      group.forEach(from => {
        lanes[from] = group.filter(to => to !== from);
      });
    });

    return lanes;
  }

};