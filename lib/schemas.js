exports.conf = {
  title: 'conf',
  type: 'object',
  properties: {
    host: {type: 'string'},
    port: {type: 'number'},
    dbname: {type: 'string'},
    collections: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: {type: 'string'},
          sharding_key: {type: 'object'},
          indexes: {type: 'array', items: {type: 'object'}}
        },
        additionalProperties: false
      }
    }
  },
  required: ['dbname', 'collections'],
  additionalProperties: false
};
