import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";
import bcrypt from "bcryptjs";

export async function PUT(request: Request) {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session
    const { data: admin, error: authError } = await supabase
        .from("admins")
        .select("id")
        .eq("session_token", token)
        .single();

    if (authError || !admin) {
        return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body = await request.json();
    const updates: Record<string, string> = {};

    if (body.first_name) updates.first_name = body.first_name;
    if (body.last_name) updates.last_name = body.last_name;
    if (body.phone) updates.phone = body.phone;

    // If changing password, hash it
    if (body.new_password) {
        if (!body.new_password || body.new_password.length < 6) {
            return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
        }
        updates.password_hash = await bcrypt.hash(body.new_password, 12);
    }

    if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { error: updateError } = await supabase
        .from("admins")
        .update(updates)
        .eq("id", admin.id);

    if (updateError) {
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    // Return updated admin
    const { data: updated } = await supabase
        .from("admins")
        .select("id, first_name, last_name, email, phone")
        .eq("id", admin.id)
        .single();

    return NextResponse.json({ admin: updated });
}
