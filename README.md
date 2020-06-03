# feathers-airtable

```bash
$ npm install --save feathers-airtable
```

> __Important:__ `feathers-airtable` implements the [Feathers Common database adapter API](https://docs.feathersjs.com/api/databases/common.html) and [querying syntax](https://docs.feathersjs.com/api/databases/querying.html).


## API

### `service(options)`

Returns a new service instance initialized with the given options.

```js
const service = require('feathers-airtable');

app.use('/my-table', service({
  apiKey: '123123213'
  baseId: '123123'
  tableName: 'Table 1'
}));
app.use('/my-table', service({ storage, id, startId, name, store, paginate }));
```

__Options:__

- `storage` (**required**) - The local storage engine. You can pass in the browsers `window.airtable`, React Native's `AsyncStorage` or a NodeJS airtable module.
- `id` (*optional*, default: `'id'`) - The name of the id field property.
- `startId` (*optional*, default: `0`) - An id number to start with that will be incremented for new record.
- `name` (*optional*, default: `'feathers'`) - The key to store data under in local or async storage.
- `store` (*optional*) - An object with id to item assignments to pre-initialize the data store
- `events` (*optional*) - A list of [custom service events](https://docs.feathersjs.com/api/events.html#custom-events) sent by this service
- `paginate` (*optional*) - A [pagination object](https://docs.feathersjs.com/api/databases/common.html#pagination) containing a `default` and `max` page size
- `whitelist` (*optional*) - A list of additional query parameters to allow
- `multi` (*optional*) - Allow `create` with arrays and `update` and `remove` with `id` `null` to change multiple items. Can be `true` for all methods or an array of allowed methods (e.g. `[ 'remove', 'create' ]`)

## Example

See the [clients](https://docs.feathersjs.com/api/client.html) chapter for more information about using Feathers in the browser and React Native.

### Browser

```html
<script type="text/javascript" src="//unpkg.com/@feathersjs/client@^3.0.0/dist/feathers.js"></script>
<script type="text/javascript" src="//unpkg.com/feathers-airtable@^2.0.2/dist/feathers-airtable.js"></script>
<script type="text/javascript">
  var service = feathers.airtable({
    storage: window.airtable
  });
  var app = feathers().use('/my-table', service);

  var messages = app.service('my-table');

  messages.on('created', function(message) {
    console.log('Someone created a message', message);
  });

  messages.create({
    text: 'Message created in browser'
  });
</script>
```

### React Native

```bash
$ npm install @feathersjs/feathers feathers-airtable --save
```

```js
import React from 'react-native';
import feathers from '@feathersjs/feathers';
import airtable from 'feathers-airtable';

const { AsyncStorage } = React;

const app = feathers()
  .use('/my-table', airtable({ storage: AsyncStorage }));

const messages = app.service('my-table');

messages.on('created', function(message) {
  console.log('Someone created a message', message);
});

messages.create({
  text: 'Message from React Native'
});
```

## To Do
- Refactor query parse
- Update Docs
- Make public

## License

Copyright (c) 2017

Licensed under the [MIT license](LICENSE).