import { Application } from '@/app/types';
import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://tline011:Database@employme.kwfqq.mongodb.net/?retryWrites=true&w=majority&appName=EmployMe";
const client = new MongoClient(uri);

export async function addApplication(application : Application) {
    try {
        console.log("Connecting to MongoDB...");
        await client.connect();

        const collection = client.db("EmployMe").collection("Applications");

        const appWithId = {
            ...application,
        };

        console.log("Inserting new application into the database...");
        const result = await collection.insertOne(appWithId);

        console.log(`Inserted job post with ID: ${result.insertedId}`);
        return { success: true, id: result.insertedId };
    } catch (err : any) {
        console.error("Error adding job post:", err);
        return { success: false, error: err.message };
    } finally {
        await client.close();
        console.log("MongoDB connection closed.");
    }
}
