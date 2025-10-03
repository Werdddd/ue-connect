import { Client, Account, Databases } from "appwrite";

const client = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1") // replace with your endpoint
  .setProject("YOUR_PROJECT_ID");

const account = new Account(client);
const databases = new Databases(client);

export { client, account, databases };
