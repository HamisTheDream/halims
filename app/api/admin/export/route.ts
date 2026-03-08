import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { constituencyData } from "../../../data/constituencyData";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: Request) {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Security Check: Validate Admin Token
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
        return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { data: admin, error: authError } = await supabase
        .from("admins")
        .select("id")
        .eq("session_token", token)
        .single();

    if (authError || !admin) {
        return NextResponse.json({ error: "Invalid or expired session" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";
    const lgaFilter = searchParams.get("lga") || "";

    let query = supabase
        .from("supporters")
        .select("full_name, phone, whatsapp, email, gender, age_range, lga, ward, polling_unit_name, polling_unit_code, occupation, has_pvc, volunteer, hear_about, created_at")
        .order("lga")
        .order("ward")
        .order("created_at", { ascending: false });

    if (lgaFilter) {
        query = query.eq("lga", lgaFilter);
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = data || [];

    if (format === "csv") {
        const headers = ["Full Name", "Phone", "WhatsApp", "Email", "Gender", "Age Range", "LGA", "Ward", "Polling Unit", "PU Code", "Occupation", "Has PVC", "Volunteer", "Heard Via", "Registered At"];
        const csvLines = [
            headers.join(","),
            ...rows.map(r => [
                `"${(r.full_name || "").replace(/"/g, '""')}"`,
                r.phone || "",
                r.whatsapp || "",
                r.email || "",
                r.gender || "",
                r.age_range || "",
                r.lga || "",
                `"${(r.ward || "").replace(/"/g, '""')}"`,
                `"${(r.polling_unit_name || "").replace(/"/g, '""')}"`,
                r.polling_unit_code || "",
                `"${(r.occupation || "").replace(/"/g, '""')}"`,
                r.has_pvc || "",
                r.volunteer ? "Yes" : "No",
                r.hear_about || "",
                r.created_at || "",
            ].join(","))
        ];

        return new NextResponse(csvLines.join("\n"), {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="supporters_${lgaFilter || "all"}_${new Date().toISOString().split("T")[0]}.csv"`,
            },
        });
    }

    // Summary report format
    const summary = constituencyData.map(lga => ({
        lga: lga.name,
        totalWards: lga.wards.length,
        totalPUs: lga.wards.reduce((s, w) => s + w.pollingUnits.length, 0),
        supporters: rows.filter(r => r.lga === lga.name).length,
        wards: lga.wards.map(w => ({
            name: w.name,
            pus: w.pollingUnits.length,
            supporters: rows.filter(r => r.ward === w.name).length,
        })),
    }));

    return NextResponse.json({
        generatedAt: new Date().toISOString(),
        totalSupporters: rows.length,
        constituency: "Ankpa Federal Constituency",
        lgas: summary,
    });
}
