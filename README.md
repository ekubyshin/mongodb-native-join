# mongodb-native-join
Join queries for mongodb native driver.

Easily join multiple queries into single query.

Support chain.

#API
cursor(sourceCursor) - returns new wrapped cursor

join(field, collectionName) - query all fields from destination collection

join(field, collectionName, project) - query specified fields from destination collection


#Usage:

    import joinedCursor from 'mongodb-native-join'
    import {MongoClient} from 'mongodb'

    const db = MongoClient.connect('your_server', (err, db) => {
    	const cursor = joinedCursor(db.collection('som_collection').find('posts'));

    	cursor
    		.join('author', 'users', 'login firstName lastName')
			.join('comments', 'comments')
			.toArray();
		//do something    		
	});
      
