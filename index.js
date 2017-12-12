const redis = require('redis');
const {EventEmitter} = require('events');

module.exports = class Redis extends EventEmitter {
    constructor(config) {
        super();
        this.config = config;
    }

    /**
     * @public
     * @return {Promise<*>}
     */
    connect() {
        return new Promise((resolve, reject) => {
            this.connection = redis.createClient(this.config.port, this.config.host);

            if (this.config.password) {
                this.connection.auth(this.config.password, err => {
                    if (err) {
                        this.emit('error', err);
                        reject(err);
                    }
                });
            }

            this.connection.on('ready', data => {
                this.emit('ready');
                resolve(data);
            });

            this.connection.on('error', err => {
                this.emit('error', err);
                reject(err);
            });

            this.connection.on('end', data => this.emit('end', data));
        });
    }

    /**
     * @public
     * @param {string} command
     * @param {array} ...rest
     * @return {Promise<*>}
     */
    call(command, ...rest) {
        return new Promise((resolve, reject) => {
            if (this.connection[command]) {
                this.connection[command].apply(this.connection, rest.concat((err, data) => {
                    if (err) {
                        this.emit('error', err);
                        reject(err);
                    }

                    resolve(data);
                }));
            } else {
                reject(new Error(`No such command: ${command}`));
            }
        });
    }

    /**
     * @public
     * @param {object} shape
     * @return {Promise<object>}
     */
    multi(shape) {
        const [commands, keys] = Object.keys(shape).reduce(([commands, entries], entry) => ([
            commands.concat([shape[entry]]),
            entries.concat(entry), 
        ]), [[], []]);

        return new Promise((resolve, reject) => {
            this.connection.multi(commands).exec((err, replies) => {
                if (err) {
                    this.emit('error', err);
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