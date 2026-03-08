"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { useRevealOnScroll } from "../hooks/useRevealOnScroll";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { constituencyData } from "../data/constituencyData";
import { supabase } from "../lib/supabase";
import styles from "./register.module.css";

export default function RegisterPageClient() {
    const revealRef = useRevealOnScroll();
    const fileRef = useRef<HTMLInputElement>(null);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [showToast, setShowToast] = useState(false);
    const [totalSupporters, setTotalSupporters] = useState(0);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState("");
    const [form, setForm] = useState({
        fullName: "", phone: "", whatsapp: "", email: "", gender: "",
        ageRange: "", lga: "", ward: "", pollingUnit: "", occupation: "",
        volunteer: false, hasPVC: "", hearAbout: "", website_url: "",
    });

    // Fetch live supporter count
    useEffect(() => {
        supabase.from("supporters").select("*", { count: "exact", head: true })
            .then(({ count }) => { if (count !== null) setTotalSupporters(count); });
    }, [submitted]);

    const selectedLGA = useMemo(() => constituencyData.find((l) => l.name === form.lga), [form.lga]);
    const selectedWard = useMemo(() => selectedLGA?.wards.find((w) => w.name === form.ward), [selectedLGA, form.ward]);
    const selectedPU = useMemo(() => selectedWard?.pollingUnits.find((p) => p.code === form.pollingUnit), [selectedWard, form.pollingUnit]);

    const update = (field: string, value: string | boolean) => {
        setForm((prev) => {
            const next = { ...prev, [field]: value };
            if (field === "lga") { next.ward = ""; next.pollingUnit = ""; }
            if (field === "ward") { next.pollingUnit = ""; }
            return next;
        });
    };

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setError("Photo must be under 5MB");
            return;
        }
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Honeypot check (anti-bot)
        if (form.website_url !== "") {
            // Silently resolve for bots to waste their time
            setShowToast(true);
            setTimeout(() => {
                setSubmitted(true);
                setTimeout(() => setShowToast(false), 3000);
            }, 1500);
            return;
        }

        setSubmitting(true);
        setError("");

        let photoUrl: string | null = null;

        // Upload photo if selected
        if (photoFile) {
            const ext = photoFile.name.split(".").pop();
            const fileName = `supporters/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from("photos")
                .upload(fileName, photoFile, { cacheControl: "3600", upsert: false });

            if (uploadError) {
                console.error("Supabase Storage error:", uploadError);
                setError(`Failed to upload photo: ${uploadError.message}`);
                setSubmitting(false);
                return;
            }

            const { data: urlData } = supabase.storage.from("photos").getPublicUrl(fileName);
            photoUrl = urlData.publicUrl;
        }

        // Capture URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const utmSource = urlParams.get("utm_source") || null;
        const utmMedium = urlParams.get("utm_medium") || null;
        const utmCampaign = urlParams.get("utm_campaign") || null;
        const referrerId = urlParams.get("ref") || null;

        const { error: insertError } = await supabase.from("supporters").insert({
            full_name: form.fullName,
            phone: form.phone,
            whatsapp: form.whatsapp || null,
            email: form.email || null,
            gender: form.gender,
            age_range: form.ageRange,
            lga: form.lga,
            ward: form.ward,
            polling_unit_code: form.pollingUnit || null,
            polling_unit_name: selectedPU?.name || null,
            occupation: form.occupation || null,
            has_pvc: form.hasPVC,
            volunteer: form.volunteer,
            hear_about: form.hearAbout || null,
            photo_url: photoUrl,
            utm_source: utmSource,
            utm_medium: utmMedium,
            utm_campaign: utmCampaign,
            referrer_id: referrerId,
        });

        setSubmitting(false);

        if (insertError) {
            console.error("Supabase error:", insertError);
            if (insertError.code === "23505") {
                setError("This phone number is already registered! If you believe this is an error, please contact the campaign office.");
            } else {
                setError("Something went wrong. Please try again or contact the campaign office.");
            }
            return;
        }

        // Show toast then transition to success
        setShowToast(true);
        setTimeout(() => {
            setSubmitted(true);
            setTimeout(() => setShowToast(false), 3000);
        }, 1500);
    };

    return (
        <div ref={revealRef}>
            <Navbar />

            {/* Submit Overlay */}
            {submitting && (
                <div className={styles.submitOverlay}>
                    <div className={styles.overlaySpinner} />
                    <p className={styles.overlayText}>Registering your support...</p>
                </div>
            )}

            {/* Toast Notification */}
            {showToast && (
                <div className={styles.toast}>
                    <span className={styles.toastIcon}>🎉</span>
                    <div className={styles.toastBody}>
                        <span className={styles.toastTitle}>Registration Complete!</span>
                        <span className={styles.toastDesc}>Welcome to the movement, {form.fullName.split(" ")[0]}!</span>
                    </div>
                    <div className={styles.toastBar} />
                </div>
            )}

            {/* Hero */}
            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <p className={styles.heroEyebrow}>Support Rt. Hon. Abdullahi Ibrahim Ali</p>
                    <h1 className={styles.heroTitle}>Register as a<br /><em>Campaign Supporter</em></h1>
                    <p className={styles.heroDesc}>Your support helps us map coverage across every ward and polling unit. Join the movement today.</p>
                </div>
            </section>

            {/* Form Section */}
            <section className={styles.formSection}>
                <div className="container">
                    {submitted ? (
                        <div className={`${styles.successCard} reveal`}>
                            <div className={styles.successIcon}>🎉</div>
                            <h2 className={styles.successTitle}>Registration Successful!</h2>
                            <p className={styles.successDesc}>Dear <strong>{form.fullName}</strong>, thank you for supporting Rt. Hon. Abdullahi Ibrahim Ali (Halims) for House of Representatives. Your registration is confirmed. Together, we will transform Ankpa Federal Constituency!</p>
                            <div className={styles.successActions}>
                                <a href="/endorsement" className="btn-primary">📸 Create Endorsement Flyer</a>
                                <a href="/" className="btn-outline" style={{ color: "var(--blue-deep)", borderColor: "var(--blue-deep)" }}>← Back to Home</a>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.formGrid}>
                            <div className={`${styles.formCard} reveal`}>
                                <div className={styles.formHeader}>
                                    <h2 className={styles.formTitle}>Supporter Registration</h2>
                                    <p className={styles.formSubtitle}>Fill in your details below. Fields marked * are required.</p>
                                </div>
                                <form onSubmit={handleSubmit} className={styles.form}>
                                    {/* HONEYPOT FIELD (Hidden from real users, bots will try to fill it) */}
                                    <div style={{ display: 'none' }} aria-hidden="true">
                                        <label>Website URL</label>
                                        <input
                                            type="text"
                                            name="website_url"
                                            tabIndex={-1}
                                            autoComplete="off"
                                            value={form.website_url}
                                            onChange={e => update("website_url", e.target.value)}
                                        />
                                    </div>

                                    {/* Photo Upload */}
                                    <div className={styles.photoUpload}>
                                        <div className={styles.photoCircle} onClick={() => fileRef.current?.click()}>
                                            {photoPreview ? (
                                                <img src={photoPreview} alt="Profile preview" />
                                            ) : (
                                                <div className={styles.photoPlaceholder}>
                                                    <span>📷</span>
                                                    <span>Add Photo</span>
                                                </div>
                                            )}
                                        </div>
                                        <span className={styles.photoLabel}>Upload your profile photo (optional, max 5MB)</span>
                                        <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display: "none" }} />
                                    </div>

                                    {/* Personal Information */}
                                    <div className={styles.fieldGroup}>
                                        <h3 className={styles.groupTitle}>Personal Information</h3>
                                        <div className={styles.fieldRow}>
                                            <div className={styles.field}>
                                                <label className={styles.label}>Full Name *</label>
                                                <input type="text" required className={styles.input} placeholder="Enter your full name" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} />
                                            </div>
                                        </div>
                                        <div className={styles.fieldRow2}>
                                            <div className={styles.field}>
                                                <label className={styles.label}>Phone Number *</label>
                                                <input type="tel" required className={styles.input} placeholder="+234 xxx xxx xxxx" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
                                            </div>
                                            <div className={styles.field}>
                                                <label className={styles.label}>WhatsApp Number</label>
                                                <input type="tel" className={styles.input} placeholder="Same as phone if blank" value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} />
                                            </div>
                                        </div>
                                        <div className={styles.fieldRow2}>
                                            <div className={styles.field}>
                                                <label className={styles.label}>Email Address</label>
                                                <input type="email" className={styles.input} placeholder="your@email.com" value={form.email} onChange={(e) => update("email", e.target.value)} />
                                            </div>
                                            <div className={styles.field}>
                                                <label className={styles.label}>Occupation</label>
                                                <input type="text" className={styles.input} placeholder="e.g. Teacher, Trader" value={form.occupation} onChange={(e) => update("occupation", e.target.value)} />
                                            </div>
                                        </div>
                                        <div className={styles.fieldRow2}>
                                            <div className={styles.field}>
                                                <label className={styles.label}>Gender *</label>
                                                <select required className={styles.select} value={form.gender} onChange={(e) => update("gender", e.target.value)}>
                                                    <option value="">Select gender</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                            <div className={styles.field}>
                                                <label className={styles.label}>Age Range *</label>
                                                <select required className={styles.select} value={form.ageRange} onChange={(e) => update("ageRange", e.target.value)}>
                                                    <option value="">Select age range</option>
                                                    <option value="18-25">18–25</option>
                                                    <option value="26-35">26–35</option>
                                                    <option value="36-50">36–50</option>
                                                    <option value="51+">51+</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Location */}
                                    <div className={styles.fieldGroup}>
                                        <h3 className={styles.groupTitle}>Constituency Location</h3>
                                        <div className={styles.fieldRow2}>
                                            <div className={styles.field}>
                                                <label className={styles.label}>State</label>
                                                <input type="text" className={styles.input} value="Kogi" disabled />
                                            </div>
                                            <div className={styles.field}>
                                                <label className={styles.label}>Local Government Area *</label>
                                                <select required className={styles.select} value={form.lga} onChange={(e) => update("lga", e.target.value)}>
                                                    <option value="">Select LGA</option>
                                                    {constituencyData.map((lga) => (
                                                        <option key={lga.name} value={lga.name}>{lga.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className={styles.fieldRow2}>
                                            <div className={styles.field}>
                                                <label className={styles.label}>Ward *</label>
                                                <select required className={styles.select} value={form.ward} onChange={(e) => update("ward", e.target.value)} disabled={!form.lga}>
                                                    <option value="">{form.lga ? "Select ward" : "Select LGA first"}</option>
                                                    {selectedLGA?.wards.map((w) => (
                                                        <option key={w.name} value={w.name}>{w.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className={styles.field}>
                                                <label className={styles.label}>Polling Unit</label>
                                                <select className={styles.select} value={form.pollingUnit} onChange={(e) => update("pollingUnit", e.target.value)} disabled={!form.ward}>
                                                    <option value="">{form.ward ? "Select polling unit" : "Select ward first"}</option>
                                                    {selectedWard?.pollingUnits.map((pu) => (
                                                        <option key={pu.code} value={pu.code}>{pu.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Campaign */}
                                    <div className={styles.fieldGroup}>
                                        <h3 className={styles.groupTitle}>Campaign Details</h3>
                                        <div className={styles.fieldRow2}>
                                            <div className={styles.field}>
                                                <label className={styles.label}>Do you have a PVC? *</label>
                                                <select required className={styles.select} value={form.hasPVC} onChange={(e) => update("hasPVC", e.target.value)}>
                                                    <option value="">Select</option>
                                                    <option value="Yes">Yes</option>
                                                    <option value="No">No</option>
                                                </select>
                                            </div>
                                            <div className={styles.field}>
                                                <label className={styles.label}>How did you hear about us?</label>
                                                <select className={styles.select} value={form.hearAbout} onChange={(e) => update("hearAbout", e.target.value)}>
                                                    <option value="">Select</option>
                                                    <option value="Social Media">Social Media</option>
                                                    <option value="Friend/Family">Friend / Family</option>
                                                    <option value="Rally">Campaign Rally</option>
                                                    <option value="Radio">Radio</option>
                                                    <option value="Website">Website</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className={styles.checkboxRow}>
                                            <label className={styles.checkbox}>
                                                <input type="checkbox" checked={form.volunteer} onChange={(e) => update("volunteer", e.target.checked)} />
                                                <span className={styles.checkmark} />
                                                <span className={styles.checkLabel}>I want to volunteer for the campaign</span>
                                            </label>
                                        </div>
                                    </div>

                                    {error && <p className={styles.errorMsg}>⚠️ {error}</p>}

                                    <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={submitting}>
                                        {submitting ? (
                                            <>
                                                <span className={styles.spinner} />
                                                Registering...
                                            </>
                                        ) : (
                                            "✍️ Register My Support"
                                        )}
                                    </button>
                                </form>
                            </div>

                            {/* Sidebar */}
                            <div className={styles.sidebar}>
                                <div className={`${styles.sidebarCard} reveal reveal-delay-2`}>
                                    <h3 className={styles.sidebarTitle}>Why Register?</h3>
                                    <ul className={styles.sidebarList}>
                                        <li>📊 Help us track constituency coverage</li>
                                        <li>📱 Receive campaign updates via SMS</li>
                                        <li>🗳️ Get election-day reminders</li>
                                        <li>🤝 Connect with ward leaders</li>
                                        <li>📸 Access endorsement flyer tools</li>
                                    </ul>
                                </div>
                                <div className={`${styles.sidebarStats} reveal reveal-delay-3`}>
                                    <div className={styles.sidebarStat}><span className={styles.sidebarStatNum}>{totalSupporters > 0 ? totalSupporters.toLocaleString() : "—"}</span><span className={styles.sidebarStatLabel}>Supporters</span></div>
                                    <div className={styles.sidebarStat}><span className={styles.sidebarStatNum}>3</span><span className={styles.sidebarStatLabel}>LGAs</span></div>
                                    <div className={styles.sidebarStat}><span className={styles.sidebarStatNum}>34</span><span className={styles.sidebarStatLabel}>Wards</span></div>
                                </div>
                                <div className={`${styles.sidebarQuote} reveal reveal-delay-4`}>
                                    <p>&ldquo;Every registration is a vote of confidence. Together, we build a stronger, more prosperous constituency.&rdquo;</p>
                                    <span>— Rt. Hon. Abdullahi Ibrahim Ali</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    );
}
