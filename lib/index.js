import _ from 'lodash'
import mongodb from 'mongodb'

const toObjectId = (id) => (new mongodb.ObjectId(id));

class Cursor {
    constructor(cursor) {
        this._query = [];
        if (cursor instanceof mongodb.Cursor) {
            this._source = cursor;
            this._db = cursor.options.db;
        } else {
            throw new Error('You must provide a mongodb cursor instance');
        }
    }
    join(field, collectionName, project) {
        let opts = {field, collectionName};
        if (project) {
            opts = {...opts, project};
        }
        this._query.push(opts);
        return this;
    }
    _getIdsForField(sources, field) {
        return _.uniq(sources.reduce((memo, src) => {
            let curField = _.get(src, field), ids = [];
            if (Array.isArray(curField)) {
                ids = curField.map(id => id.toString());
                memo = memo.concat(ids);
            } else {
                memo.push(curField.toString());
            }
            return memo;
        }, [])).map(id => toObjectId(id));
    }
    _getProjection(project) {
        return  project.split(/\s/gi).reduce((memo, key) => (
            {...memo, [key]:true}
            ), {}) || null;
    }
    _prepareQueries(source) {
        return this._query.map(option => {
            let {field, project, collectionName} = option;
            let projection = project && this._getProjection(project);
            let criteria = this._getIdsForField(source, field);
            if (!criteria.length) {
                return Promise.resolve([]);
            }
            let cursor = this._db.collection(collectionName).find(
                {
                    _id: {
                        $in: criteria
                    }
                }
            );
            if (projection) {
                cursor = cursor.project(projection);
            }
            return cursor.toArray();
        })
    }
    _mergeResults(source, resultsToMerge) {
        return source.map(src => {
            let source = {...src};
            this._query.forEach((option, index) => {
                let target, field = _.get(source, option.field), results = resultsToMerge[index];
                if (Array.isArray(field)) {
                    target = field.map(id => results.find(item => item._id.toString() === id.toString()));
                } else {
                    target = resultsToMerge[index].find(item => item._id.toString() === field.toString());
                }
                target && _.set(source, option.field, target);
            });
            return source;
        });
    }
    async toArray() {
        let sources = await this._source.toArray();

        if (!sources || !sources.length) {
            return [];
        }

        let promises = this._prepareQueries(sources);

        const resultsToMerge = await Promise.all(promises);

        if (!resultsToMerge || resultsToMerge.length < this._query.length) {
            throw new Error(resultsToMerge);
        }

        this._source = null;
        this._db = null;

        const results = this._mergeResults(sources, resultsToMerge);

        this._query.length = 0;

        return results;
    }
}

export default (cursor) => {

    return new Cursor(cursor);
}