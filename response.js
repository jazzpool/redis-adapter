const NOT_ITERABLE_ERROR = new Error('Response is not iterable');

class Response {
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

                    throw NOT_ITERABLE_ERROR;
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

    take(limit) {
        return _takeWrap(this.promise, limit);
    }

    takeLatest(limit) {
        return _takeLatesWrap(this.promise, limit);
    }

    sort(fn, asc = true) {
        return new Response(this.promise.then(data => {
            if (Array.isArray(data)) {
                const sorter = typeof fn === 'string' ? (a, b) => (asc ? a[fn] - b[fn] : b[fn] - a[fn]) : fn
                return data.sort(sorter);
            }

            throw NOT_ITERABLE_ERROR;
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

            throw NOT_ITERABLE_ERROR;
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
            
            throw NOT_ITERABLE_ERROR;
        }));
    }

    then(fn) {
        return this.promise.then(fn);
    }

    catch(fn) {
        return this.promise.catch(fn);
    }
}

const wrap = fn => (el, ...rest) => {
    return new Response(el.then(data => {
        if (!Array.isArray(data)) {
            throw new Error('Response is not iterable');
        }

        return fn(data, ...rest);
    }))
}

const _takeWrap = wrap((x, limit) => x.slice(0, limit));
const _takeLatesWrap = wrap((x, limit) => x.slice(-limit));

module.exports = Response