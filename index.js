const redis = require('redis');
const {EventEmitter} = require('events');

module.exports = class Redis extends EventEmitter {
    constructor(config) {
        super()
        this.config = config;
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.connection = redis.createClient(this.config.port, this.config.host);

            if (this.config.password) {
                this.connection.auth(this.config.password, err => {
                    if (err) {
                        reject(err);
                    }
                });
            }

            this.connection.on('ready', data => {
                this.emit('ready');
                resolve(data)
            });

            this.connection.on('error', err => {
                this.emit('error', err);
                reject(err);
            });

            this.connection.on('end', data => this.emit('end', data));
        });
    }

    call(command, ...args) {
        return new Promise((resolve, reject) => {
            if (this.connection[command]) {
                this.connection[command].apply(this.connection, args.concat((err, data) => {
                    if (err) {
                        reject(err)
                    }

                    resolve(data);
                }));
            } else {
                reject(new Error(`No such command: ${command}`));
            }
        });
    }

    exec(shape) {
        const [commands, keys] = Object.keys(shape).reduce(([commands, entries], entry) => ([
                commands.concat([shape[entry]]),
                entries.concat(entry), 
        ]), [[], []]);

        return new Promise((resolve, reject) => {
            this.connection.multi(commands).exec((err, replies) => {
                if (err) {
                    reject(err);
                }

                resolve(replies.reduce((acc, reply, replyIndex) => {
                    const key = keys[replyIndex];
                    acc[key] = reply
                    return acc
                }, {}));
            })
        })
    }
}