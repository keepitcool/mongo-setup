exports.conf = {
  title: 'conf',
  type: 'object',
  properties: {
    mongoUrl: {type: 'string'},
    dbname: {type: 'string'},
    collections: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: {type: 'string'},
          'sharding_key': {type: 'object'},
          indexes: {type: 'array', items: {type: 'object'}}
        },
        additionalProperties: false
      }
    }
  },
  required: ['mongoUrl', 'dbname', 'collections'],
  additionalProperties: false
};
