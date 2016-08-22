# mongodb-native-join
Join queries for mongodb native driver.

Easily join multiple queries into single query.

Support chain.

#API
cursor(sourceCursor) - returns new wrapped cursor

populate(field, collectionName) - query all fields from destination collection

populate(field, collectionName, project) - query specified fields from destination collection


#Usage:

    import joinedCursor from 'mongodb-native-join'
    import {MongoClient} from 'mongodb'

    const db = MongoClient.connect('your_server', (err, db) => {
    	const cursor = joinedCursor(db.collection('som_collection').find('posts'));

    	cursor
    		.populate('author', 'users', 'login firstName lastName')
			.populate('comments', 'comments')
			.toArray();
		//do something    		
	});
      
