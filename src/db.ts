import {
  MongoClient,
  Db,
  InsertOneResult,
  Document,
  OptionalId,
} from "mongodb";
import { dbUri } from "./config";

async function connectToDatabase(): Promise<Db> {
  const uri = dbUri;

  const client = await MongoClient.connect(uri);
  const db = client.db();

  return db;
}

export async function insertOne(
  data: OptionalId<Document>
): Promise<InsertOneResult> {
  const db = await connectToDatabase();
  const result = await db
    .collection("searcher_profits")
    .insertOne({ timestamp: new Date(), ...data });
  return result;
}
