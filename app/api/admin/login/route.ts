import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
        }

        // Look up admin by email
        const { data: admin, error } = await supabase
            .from("admins")
            .select("*")
            .eq("email", email.toLowerCase().trim())
            .single();

        if (error || !admin) {
            return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, admin.password_hash);
        if (!validPassword) {
            return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
        }

        // Generate a simple session token
        const token = crypto.randomBytes(32).toString("hex");

        // Update last login and store the token
        await supabase
            .from("admins")
            .update({ last_login: new Date().toISOString(), session_token: token })
            .eq("id", admin.id);

        return NextResponse.json({
            token,
            admin: {
                id: admin.id,
                first_name: admin.first_name,
                last_name: admin.last_name,
                email: admin.email,
                phone: admin.phone,
            },
        });
    } catch {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
