import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

export async function GET(request: Request) {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: admin, error } = await supabase
        .from("admins")
        .select("id, first_name, last_name, email, phone")
        .eq("session_token", token)
        .single();

    if (error || !admin) {
        return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    return NextResponse.json({ admin });
}
