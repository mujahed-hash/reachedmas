/** Shared constants for system settings — importable from both server and client code */

export const SETTING_DEFAULTS: Record<string, string> = {
    // Free tag defaults
    "free_tag.default_trial_days": "30",
    "free_tag.default_grace_days": "5",
    "free_tag.globally_enabled": "true",
    // Scan behavior
    "scan.captcha_enabled": "true",
    "scan.anonymous_messages_enabled": "true",
    "scan.require_message": "false",
    // Notifications
    "notif.email_enabled": "true",
    "notif.sms_enabled": "true",
    "notif.push_enabled": "true",
    // Tag behavior
    "tag.auto_lock_on_trial_expiry": "true",
    "tag.grace_period_enforcement": "true",
    // Platform limits (FREE plan)
    "limits.free_max_assets": "1",
    "limits.free_max_tags_per_asset": "1",
    "limits.premium_max_assets": "20",
    // Platform features
    "feature.family_sharing": "true",
    "feature.chat_threads": "true",
    "feature.auto_replies": "true",
    "feature.vehicle_history": "true",
    "feature.nfc_programming_guide": "true",
    // Security
    "security.block_new_registrations": "false",
    "security.maintenance_mode": "false",
    "security.read_only_mode": "false",
};

export function getSettingValue(settings: Record<string, string>, key: string): string {
    return settings[key] ?? SETTING_DEFAULTS[key] ?? "";
}
