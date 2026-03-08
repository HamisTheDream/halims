import { supabase } from "./supabase";

/**
 * Log an admin action to the activity log table.
 * Call this from any admin action (login, delete, broadcast, settings change, etc.)
 */
export async function logAdminActivity(
    adminId: string | null,
    adminName: string,
    action: string,
    details?: string
) {
    try {
        await supabase.from("admin_activity_log").insert({
            admin_id: adminId,
            admin_name: adminName,
            action,
            details: details || null,
        });
    } catch (err) {
        console.error("Failed to log admin activity:", err);
    }
}
