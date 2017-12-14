module.exports = class Response {
    constructor(promise) {
        this.promise = promise;

        [
            'map',
            'filter',
            'reduce',
            'some',
            'every',
            'sort',
        ].forEach(method => {
            this[method] = function (...args) {
                return new Response(this.promise.then(data => {
                    if (Array.isArray(data)) {
                        return data[method](...args);
                    }

                    throw new Error('Response is not iterable');
                }))
            }
        })
    }

    valueOf() {
        return this.data;
    }

    toString() {
        return `[object Response<${this.data.length}>`;
    }

    orderBy(fn) {
        return this.asc(fn);
    }

    asc(fn) {
        fn = typeof fn === 'string' ? x => x[fn] : fn
        return this.sort((a, b) => fn(a) - fn(b));
    }

    desc(fn) {
        fn = typeof fn === 'string' ? x => x[fn] : fn
        return this.sort((a, b) => fn(b) - fn(a));
    }

    count() {
        return new Response(this.promise.then(data => {
            if (Array.isArray(data)) {
                return data.length
            }

            throw new Error('Response is not iterable');
        }));
    }

    paginate(page, limit) {
        if (page <= 0 || limit <= 0) {
            throw new Error('Page and Limit should be more than 30')
        }

        return new Response(this.promise.then(data => {
            if (Array.isArray(data)) {
                const start = (page - 1) * limit;
                return data.slice(start, start + limit);
            }
            
            throw new Error('Response is not iterable');
        }));
    }

    then(fn) {
        return this.promise.then(fn);
    }

    catch(fn) {
        return this.promise.catch(fn);
    }
}
