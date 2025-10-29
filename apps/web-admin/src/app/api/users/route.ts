// src/app/api/users/route.ts
import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/utils/firebaseAdmin"; // Make sure this path is correct

export async function POST(req: Request) {
  try {
    console.log("Incoming createUser request...");

    const body = await req.json();
    const { email, password, firstName, lastName, studentNumber, Course, Year } =
      body;

    // 1. Create the user in Firebase Authentication
    console.log("Step 1: Creating Auth user...");
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });
    console.log("Step 1: Auth user created. UID:", userRecord.uid);

    // 2. Define the data for the "ueDB" collection (snake_case)
    // This remains the same as before
    const ueDbData = {
      uid: userRecord.uid,
      first_name: firstName,
      last_name: lastName,
      student_number: studentNumber,
      email: email,
      course: Course,
      year_level: Year,
      is_active: true,
    };

    // 3. Define the data for the "Users" collection (new structure)
    // This is updated to match your new field requirements
    const usersData = {
      uid: userRecord.uid, // Still important to store this
      Course,
      Year,
      email,
      firstName,
      lastName,
      studentNumber,
      followers: [], // New field, default to empty array
      following: [], // New field, default to empty array
      group: false,    // New field, default to false
      orgs: [],      // New field, default to empty array
      profileImage: "", // New field, default to empty string
      role: "user",
      timestamp: new Date(),
    };

    // 4. Create both database write operations
    console.log("Step 2: Preparing parallel database writes...");
    
    // Write to "ueDB" with an auto-generated ID
    const writeToUeDB = adminDb.collection("ueDB").doc().set(ueDbData);

    // Write to "Users" with the email as the ID
    const writeToUsers = adminDb.collection("Users").doc(email).set(usersData);

    // 5. Execute both writes at the same time
    await Promise.all([writeToUeDB, writeToUsers]);
    
    console.log("Step 2: Both writes to 'ueDB' and 'Users' successful.");

    // All writes succeeded
    return NextResponse.json({ success: true, uid: userRecord.uid });

  } catch (error: any) {
    // If anything fails (Auth or either Firestore write), catch the error
    console.error("Error creating user:", error);
    return NextResponse.json(
      { success: false, error: error.message, code: error.code },
      { status: 400 }
    );
  }
}