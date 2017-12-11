# redis-adapter 🔌

This is simple Redis client adapter:

## Methods and usage


 - Create connection
```js 
const Redis = require('redis-adapter');

const client = new Redis({port: 6379, host: '127.0.0.1'});

client.connect()
    .then(() => {
        console.log('Hooray!');
    })
    .catch(error => {
        console.log('Connection failed!');
    });

client.on('end', () => {
    console.log('Connection closed')
});
```

 - Call methods
```js
client.call('smembers', 'blocks').then(smthMembers => {
    console.log('List of blocks:', blocks);
});
```

 - Use plain shapes for `multi`

```js
client.multi({
    blocks: ['smembers', 'blocks'],
    hashName: ['hget', 'data', 'name'],
    range: ['zrange', 'logs', 0, '+inf'],
}).then(({blocks, hashName, range}) => {
    console.log('blocks set:', blocks);
    console.log('hash key "name" value:', hashName);
    console.log('range:', range);
});
```