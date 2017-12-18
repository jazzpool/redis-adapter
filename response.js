module.exports = class Response {
    constructor(promise) {
        this.promise = promise;

        [
            'map',
            'filter',
            'reduce',
            'some',
            'every',
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
        return this.sort(fn);
    }

    sort(fn, asc = true) {
        return new Response(this.promise.then(data => {
            if (Array.isArray(data)) {
                const sorter = typeof fn === 'string' ? (a, b) => (asc ? a[fn] - b[fn] : b[fn] - a[fn]) : fn
                return data.sort(sorter);
            }

            throw new Error('Response is not iterable');
        }))
    }

    asc(str) {
        return this.sort(str, true);
    }

    desc(str) {
        return this.sort(str, false);
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
