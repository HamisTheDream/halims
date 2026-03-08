import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function hashPin(pin: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + "g1-salt");
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: Request) {
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const { phone, pin } = await request.json();

        if (!phone || !pin) {
            return NextResponse.json({ error: "Phone and PIN are required" }, { status: 400 });
        }

        // Find agent by phone
        const { data: agent, error } = await supabase
            .from("agents")
            .select("*")
            .eq("phone", phone)
            .single();

        if (error || !agent) {
            return NextResponse.json({ error: "Agent not found. Contact the campaign admin." }, { status: 401 });
        }

        if (!agent.is_active) {
            return NextResponse.json({ error: "Your account has been disabled. Contact the campaign admin." }, { status: 403 });
        }

        // Verify PIN
        const pinHash = await hashPin(pin);
        if (pinHash !== agent.pin_hash) {
            return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
        }

        // Generate session token
        const sessionToken = crypto.randomUUID();

        // Update last login and session
        await supabase
            .from("agents")
            .update({ last_login: new Date().toISOString(), session_token: sessionToken })
            .eq("id", agent.id);

        return NextResponse.json({
            agent: {
                id: agent.id,
                full_name: agent.full_name,
                phone: agent.phone,
                role: agent.role,
                lga: agent.lga,
                ward: agent.ward,
                polling_unit_code: agent.polling_unit_code,
                polling_unit_name: agent.polling_unit_name,
            },
            token: sessionToken,
        });
    } catch {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
