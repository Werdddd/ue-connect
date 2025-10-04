// src/app/api/users/route.ts
import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/utils/firebaseAdmin";

export async function POST(req: Request) {
  try {
    console.log("Incoming createUser request...");

    const body = await req.json();
    const { email, password, firstName, lastName, studentNumber, Course, Year } = body;

    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });

    await adminDb.collection("Users").doc(email).set({
      uid: userRecord.uid,
      studentNumber,
      firstName,
      lastName,
      email,
      Course,
      Year,
      role: "user",
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true, uid: userRecord.uid });
  } catch (error: any) {

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
