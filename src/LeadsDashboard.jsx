import { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import UserManagementModal from "./UserManagementModal";

const API_BASE = "/api";
const PAGE_SIZE = 12;

const STATUS_MAP = {
  New: { bg: "#F59E0B", color: "#000" },
  Contacted: { bg: "#3B82F6", color: "#fff" },
  "Site Visit": { bg: "#8B5CF6", color: "#fff" },
  Interested: { bg: "#06B6D4", color: "#fff" },
  Converted: { bg: "#10B981", color: "#fff" },
  Lost: { bg: "#EF4444", color: "#fff" },
};
const STATUS_LIST = Object.keys(STATUS_MAP);
const getS = (s) => STATUS_MAP[s] || { bg: "#6B7280", color: "#fff" };

const I = {
  Phone: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.02 1.22a2 2 0 012-2.18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 6.91a16 16 0 006.72 6.72l1.21-1.21a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>,
  Mail: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
  Pin: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>,
  Home: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
  Rupee: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="6" y1="3" x2="18" y2="3" /><line x1="6" y1="8" x2="18" y2="8" /><line x1="6" y1="21" x2="12" y2="8" /><path d="M6 3h8a4 4 0 010 8H6" /></svg>,
  Edit: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
  Search: () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  Reload: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" /></svg>,
  Excel: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M21.17 3.25Q21.5 3.25 21.76 3.5 22 3.74 22 4.08V19.92Q22 20.26 21.76 20.5 21.5 20.75 21.17 20.75H7.83Q7.5 20.75 7.24 20.5 7 20.26 7 19.92V17H2.83Q2.5 17 2.24 16.76 2 16.5 2 16.17V7.83Q2 7.5 2.24 7.24 2.5 7 2.83 7H7V4.08Q7 3.74 7.24 3.5 7.5 3.25 7.83 3.25M7 13.06L8.18 15.28H9.97L8 12 9.93 8.72H8.22L7.1 10.89 7.04 10.96 7 11.03 6.96 10.96 6.9 10.89 5.78 8.72H4.03L6 12 4.03 15.28H5.82M20.5 19.5V17H13V19.5M20.5 15.5V12.5H13V15.5M20.5 11V8H13V11M20.5 6.5V4.75H8.5V6.5Z" /></svg>,
  Prev: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>,
  Next: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>,
  WA: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>,
  Close: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  User: () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  Brief: () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" /></svg>,
  Globe: () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>,
  Clock: () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  Partner: () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>,
  Note: () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
  Project: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
  Plus: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
};

const fmtDate = (d) => d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null;

// ─── DETAIL DRAWER ─────────────────────────────────────────────────────────────
// CHANGE 1: "Update" ActionBtn removed — only Call and WhatsApp remain
// CHANGE 2: Full black/grey palette replacing purple/indigo tones
function DetailDrawer({ lead, onClose, onEdit }) {
  const st = getS(lead.status);
  const addr = [lead.address, lead.city, lead.pinCode].filter(Boolean).join(", ");

  const Sec = ({ icon, title }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "20px 0 10px", paddingBottom: 8, borderBottom: "1px solid #2a2a2a" }}>
      <span style={{ color: "#888888" }}>{icon}</span>
      <span style={{ color: "#888888", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{title}</span>
    </div>
  );

  const F = ({ label, value, accent }) => {
    if (!value) return null;
    return (
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <div style={{ color: "#666666", fontSize: 12, minWidth: 130, flexShrink: 0, paddingTop: 1 }}>{label}</div>
        <div style={{ color: accent || "#e0e0e0", fontSize: 13, fontWeight: 600, wordBreak: "break-word", lineHeight: 1.4 }}>{value}</div>
      </div>
    );
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#000a", zIndex: 400, animation: "fadeIn .2s ease" }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(480px,100vw)", background: "#111111", borderLeft: "1px solid #2a2a2a", zIndex: 500, display: "flex", flexDirection: "column", animation: "slideIn .25s cubic-bezier(.4,0,.2,1)", boxShadow: "-8px 0 40px #00000088", overscrollBehavior: "contain" }}>

        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #2a2a2a", background: "#161616", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#2a2a2a,#3a3a3a)", display: "flex", alignItems: "center", justifyContent: "center", color: "#888888", flexShrink: 0 }}>
                <svg width="26" height="26" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" /></svg>
              </div>
              <div>
                <div style={{ color: "#f0f0f0", fontWeight: 800, fontSize: 17 }}>{lead.fullName || "—"}</div>
                {lead.project && <div style={{ color: "#aaaaaa", fontSize: 11.5, marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}><I.Project /> {lead.project}</div>}
                <span style={{ display: "inline-block", marginTop: 6, background: st.bg, color: st.color, padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{lead.status || "—"}</span>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "#222222", border: "1px solid #3a3a3a", color: "#888888", borderRadius: 8, width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <I.Close />
            </button>
          </div>
          {/* UPDATE BUTTON REMOVED — only Call and WhatsApp */}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <ActionBtn onClick={() => window.open(`tel:${lead.mobileNumber}`)} bg="#222222" color="#aaaaaa" border="#3a3a3a"><I.Phone /> Call</ActionBtn>
            <ActionBtn onClick={() => window.open(`https://wa.me/91${lead.mobileNumber?.replace(/\D/g, "")}`, "_blank")} bg="#0f2a1a" color="#4ade80" border="#1a3a2a"><I.WA /> WhatsApp</ActionBtn>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "4px 24px 32px" }}>
          <Sec icon={<I.Project />} title="Project" />
          <F label="Project Name" value={lead.project} accent="#cccccc" />

          <Sec icon={<I.User />} title="Contact Information" />
          <F label="Mobile" value={lead.mobileNumber} accent="#60a5fa" />
          <F label="Email" value={lead.email} accent="#60a5fa" />
          <F label="Address" value={addr} />
          <F label="Country" value={lead.country} />

          <Sec icon={<I.Home />} title="Property Interest" />
          <F label="Property Type" value={lead.propertyType} accent="#aaaaaa" />
          <F label="Budget Range" value={lead.budgetRange} accent="#4ade80" />
          <F label="Visiting For" value={lead.visitingFor} />
          <F label="Purpose" value={lead.purposeOfPurchase} />
          <F label="Current Home" value={lead.currentResidentType} />
          <F label="Will Buy In" value={lead.willBuyIn} />

          {(lead.occupation || lead.organization || lead.designation || lead.industry) && (
            <>
              <Sec icon={<I.Brief />} title="Professional Details" />
              <F label="Occupation" value={lead.occupation} />
              <F label="Organization" value={lead.organization} />
              <F label="Designation" value={lead.designation} />
              <F label="Industry" value={lead.industry} />
              <F label="Office" value={lead.officeLocation} />
            </>
          )}

          <Sec icon={<I.Globe />} title="Lead Source" />
          <F label="Source" value={lead.source} accent="#fb923c" />
          <F label="Heard About Us" value={Array.isArray(lead.hearAboutUs) ? lead.hearAboutUs.join(", ") : lead.hearAboutUs} />
          <F label="Reference" value={lead.referenceDetails} />
          <F label="Assigned To" value={lead.assignedTo} />
          <F label="Will Buy In" value={lead.willBuyIn} />

          {(lead.channelPartnerName || lead.channelPartnerCompany) && (
            <>
              <Sec icon={<I.Partner />} title="Channel Partner" />
              <F label="Company" value={lead.channelPartnerCompany} />
              <F label="Name" value={lead.channelPartnerName} />
              <F label="Mobile" value={lead.channelPartnerMobile} />
              <F label="RERA No." value={lead.channelPartnerRERA} />
              <F label="Email" value={lead.channelPartnerEmail} />
            </>
          )}

          {(lead.family || lead.reason || lead.funding || lead.inventoryPitched ||
            lead.quotation || lead.interested || lead.ageGroup || lead.caste) && (
              <>
                <Sec icon={<I.Brief />} title="Lead Details" />
                <F label="Family" value={lead.family} />
                <F label="Reason" value={lead.reason} />
                <F label="Funding" value={lead.funding} />
                <F label="Inventory Pitched" value={lead.inventoryPitched} />
                <F label="Quotation" value={lead.quotation} />
                <F label="Interested" value={lead.interested} />
                <F label="Age Group" value={lead.ageGroup} />
                <F label="Occupation" value={lead.occupation} />
                <F label="Caste" value={lead.caste} />
              </>
            )}

          {(lead.revisitDate || lead.nextFollowUp) && (
            <>
              <Sec icon={<I.Clock />} title="Follow Up" />
              <F label="Revisit Date" value={lead.revisitDate} />
              <F label="Next Follow Up" value={lead.nextFollowUp} />
            </>
          )}

          {lead.comments && (
            <>
              <Sec icon={<I.Note />} title="Comments" />
              <div style={{ background: "#1a1a1a", border: "1px solid #333333", borderRadius: 10, padding: "12px 14px", color: "#aaaaaa", fontSize: 13, lineHeight: 1.6 }}>{lead.comments}</div>
            </>
          )}

          {lead.notes && (
            <>
              <Sec icon={<I.Note />} title="Notes" />
              <div style={{ background: "#1a1a1a", border: "1px solid #333333", borderRadius: 10, padding: "12px 14px", color: "#aaaaaa", fontSize: 13, lineHeight: 1.6 }}>{lead.notes}</div>
            </>
          )}

          <Sec icon={<I.Clock />} title="Timeline" />
          <F label="Created" value={fmtDate(lead.createdAt)} />
          <F label="Updated" value={fmtDate(lead.updatedAt)} />
        </div>
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
    </>
  );
}

function ActionBtn({ onClick, bg, color, border, children }) {
  return (
    <button onClick={onClick} style={{ flex: 1, background: bg, color, border: `1px solid ${border || "#3a3a3a"}`, borderRadius: 8, padding: "8px 6px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "opacity .15s" }}
      onMouseEnter={e => e.currentTarget.style.opacity = ".7"}
      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
    >{children}</button>
  );
}

function IconBtn({ onClick, bg, color, border, title, children }) {
  return (
    <button onClick={onClick} title={title} style={{ background: bg, color, border: `1px solid ${border || "#3a3a3a"}`, borderRadius: 8, width: 36, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "opacity .15s", flexShrink: 0 }}
      onMouseEnter={e => e.currentTarget.style.opacity = ".7"}
      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
    >{children}</button>
  );
}

function LeadCard({ lead, onView, onUpdate }) {
  const [hovered, setHovered] = useState(false);
  const st = getS(lead.status);
  const addr = [lead.address, lead.city].filter(Boolean).join(", ");

  return (
    <div onClick={() => onView(lead)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ background: hovered ? "#1a1a1a" : "#141414", border: `1px solid ${hovered ? "#555555" : "#2a2a2a"}`, borderRadius: 14, padding: "14px 14px 12px", display: "flex", flexDirection: "column", transition: "all .2s", boxShadow: hovered ? "0 6px 32px #00000044" : "none", cursor: "pointer", position: "relative" }}>

      <div style={{ position: "absolute", top: 10, right: 12, color: "#aaaaaa", fontSize: 10.5, fontWeight: 600, background: "#222222", borderRadius: 6, padding: "2px 8px", border: "1px solid #444444", opacity: hovered ? 1 : 0, transition: "opacity .2s", pointerEvents: "none" }}>View Details →</div>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: hovered ? "linear-gradient(135deg,#2a2a2a,#3a3a3a)" : "linear-gradient(135deg,#1e1e1e,#2a2a2a)", display: "flex", alignItems: "center", justifyContent: "center", color: hovered ? "#aaaaaa" : "#666666", flexShrink: 0, transition: "all .2s" }}>
          <svg width="17" height="17" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" /></svg>
        </div>
        <div style={{ flex: 1, minWidth: 0, paddingRight: hovered ? 80 : 0, transition: "padding .2s" }}>
          <div style={{ color: "#f0f0f0", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lead.fullName || "—"}</div>
          <span style={{ display: "inline-block", marginTop: 4, background: st.bg, color: st.color, padding: "1px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>{lead.status || "—"}</span>
        </div>
      </div>

      <div style={{ borderTop: "1px solid #222222", marginBottom: 9 }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 7, flex: 1 }}>
        <CardRow icon={<I.Phone />} value={lead.mobileNumber} />
        <CardRow icon={<I.Mail />} value={lead.email} dim />
        <CardRow icon={<I.Pin />} value={addr || null} dim />
        <CardRow icon={<I.Home />} value={lead.propertyType} />
        <CardRow icon={<I.Rupee />} value={lead.budgetRange} />
      </div>

      <div style={{ display: "flex", gap: 6, marginTop: 10 }} onClick={e => e.stopPropagation()}>
        <IconBtn onClick={() => window.open(`tel:${lead.mobileNumber}`)} bg="#222222" color="#aaaaaa" border="#333333" title="Call">
          <I.Phone />
        </IconBtn>
        <IconBtn onClick={() => window.open(`https://wa.me/91${lead.mobileNumber?.replace(/\D/g, "")}`, "_blank")} bg="#0f2a1a" color="#4ade80" border="#1a3a2a" title="WhatsApp">
          <I.WA />
        </IconBtn>
      </div>
    </div>
  );
}

function CardRow({ icon, value, dim }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 5, fontSize: 11.5 }}>
      <span style={{ color: "#555555", marginTop: 1, flexShrink: 0 }}>{icon}</span>
      <span style={{ color: dim ? "#777777" : "#d0d0d0", fontWeight: dim ? 400 : 600, wordBreak: "break-word", lineHeight: 1.4 }}>{value}</span>
    </div>
  );
}

function UpdateModal({ lead, onClose, onSave, projects, users }) {
  const [form, setForm] = useState({
    project: lead.project || "",
    status: lead.status || "New",
    assignedTo: lead.assignedTo || "",
    willBuyIn: lead.willBuyIn || "",
    notes: lead.notes || "",
    family: lead.family || "",
    reason: lead.reason || "",
    funding: lead.funding || "",
    inventoryPitched: lead.inventoryPitched || "",
    quotation: lead.quotation || "",
    interested: lead.interested || "",
    ageGroup: lead.ageGroup || "",
    occupation: lead.occupation || "",
    caste: lead.caste || "",
    comments: lead.comments || "",
    revisitDate: lead.revisitDate || "",
    nextFollowUp: lead.nextFollowUp || "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const inp = {
    width: "100%", background: "#0d0d0d", border: "1px solid #333333",
    borderRadius: 9, padding: "9px 12px", color: "#e0e0e0",
    fontSize: 13, marginBottom: 4, boxSizing: "border-box", outline: "none",
  };

  const handleSave = async () => {
    setSaving(true); setErr("");
    try {
      const res = await fetch(`${API_BASE}/leads/${lead._id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, updatedAt: new Date() }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      onSave(await res.json()); onClose();
    } catch (e) { setErr(e.message); } finally { setSaving(false); }
  };

  const Sec = ({ title }) => (
    <div style={{ color: "#777777", fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", borderBottom: "1px solid #2a2a2a", paddingBottom: 6, marginBottom: 12, marginTop: 18 }}>{title}</div>
  );
  const Lbl = ({ children }) => (
    <div style={{ color: "#888888", fontSize: 10.5, marginBottom: 5, fontWeight: 600, letterSpacing: .3 }}>{children}</div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000d", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 600 }} onClick={onClose}>
      <div style={{ background: "#141414", border: "1px solid #333333", borderRadius: 18, padding: "24px 28px 28px", width: 520, maxWidth: "96vw", maxHeight: "92vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#f0f0f0" }}>Update Lead</div>
            <div style={{ color: "#777777", fontSize: 12, marginTop: 3 }}>{lead.fullName} · {lead.mobileNumber}</div>
          </div>
          <button onClick={onClose} style={{ background: "#222222", border: "1px solid #333333", color: "#888888", borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <Sec title="Core Details" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 200px), 1fr))", gap: "0 16px" }}>
          <div><Lbl>PROJECT</Lbl><select value={form.project} onChange={set("project")} style={inp}><option value="">— No Project —</option>{projects.map(p => <option key={p._id} value={p.projectName}>{p.projectName}</option>)}</select><div style={{ marginBottom: 10 }} /></div>
          <div><Lbl>STATUS</Lbl><select value={form.status} onChange={set("status")} style={inp}>{STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}</select><div style={{ marginBottom: 10 }} /></div>
          <div><Lbl>ASSIGNED TO</Lbl><select value={form.assignedTo} onChange={set("assignedTo")} style={inp}><option value="">— Select Agent —</option>{users.map(u => <option key={u._id} value={u.name}>{u.name}</option>)}</select><div style={{ marginBottom: 10 }} /></div>
          <div><Lbl>WILL BUY IN</Lbl><select value={form.willBuyIn} onChange={set("willBuyIn")} style={inp}><option value="">Select timeline</option>{["Immediately", "1-3 Months", "3-6 Months", "6-12 Months", "1+ Year"].map(o => <option key={o} value={o}>{o}</option>)}</select><div style={{ marginBottom: 10 }} /></div>
        </div>

        <Sec title="Lead Details" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 200px), 1fr))", gap: "0 16px" }}>
          <div><Lbl>FAMILY</Lbl><input value={form.family} onChange={set("family")} placeholder="e.g. Joint / Nuclear" style={inp} /><div style={{ marginBottom: 10 }} /></div>
          <div><Lbl>REASON</Lbl><input value={form.reason} onChange={set("reason")} placeholder="Reason for purchase" style={inp} /><div style={{ marginBottom: 10 }} /></div>
          <div><Lbl>FUNDING</Lbl><input value={form.funding} onChange={set("funding")} placeholder="e.g. Self / Loan" style={inp} /><div style={{ marginBottom: 10 }} /></div>
          <div><Lbl>INVENTORY PITCHED</Lbl><input value={form.inventoryPitched} onChange={set("inventoryPitched")} placeholder="Unit / Floor" style={inp} /><div style={{ marginBottom: 10 }} /></div>
          <div><Lbl>QUOTATION</Lbl><input value={form.quotation} onChange={set("quotation")} placeholder="e.g. ₹1.25Cr" style={inp} /><div style={{ marginBottom: 10 }} /></div>
          <div><Lbl>INTERESTED</Lbl><input value={form.interested} onChange={set("interested")} placeholder="e.g. Yes / No / Maybe" style={inp} /><div style={{ marginBottom: 10 }} /></div>
          <div><Lbl>AGE GROUP</Lbl><select value={form.ageGroup} onChange={set("ageGroup")} style={inp}><option value="">Select age group</option>{["21-30", "31-40", "41-50", "51-60", "61 Onwards"].map(o => <option key={o} value={o}>{o}</option>)}</select><div style={{ marginBottom: 10 }} /></div>
          <div><Lbl>OCCUPATION</Lbl><input value={form.occupation} onChange={set("occupation")} placeholder="e.g. Salaried / Business" style={inp} /><div style={{ marginBottom: 10 }} /></div>
          <div><Lbl>CASTE</Lbl><select value={form.caste} onChange={set("caste")} style={inp}><option value="">Select caste</option>{["Marathi", "Gujrati", "Sindhi", "Christian", "Marwadi", "Others"].map(o => <option key={o} value={o}>{o}</option>)}</select><div style={{ marginBottom: 10 }} /></div>
        </div>

        <Sec title="Follow Up" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 200px), 1fr))", gap: "0 16px" }}>
          <div><Lbl>REVISIT DATE</Lbl><input type="date" value={form.revisitDate} onChange={set("revisitDate")} style={{ ...inp, colorScheme: "dark" }} /><div style={{ marginBottom: 10 }} /></div>
          <div><Lbl>NEXT FOLLOW UP</Lbl><input type="date" value={form.nextFollowUp} onChange={set("nextFollowUp")} style={{ ...inp, colorScheme: "dark" }} /><div style={{ marginBottom: 10 }} /></div>
        </div>

        <Sec title="Comments & Notes" />
        <Lbl>COMMENTS</Lbl>
        <textarea value={form.comments} onChange={set("comments")} placeholder="Add comments…" style={{ ...inp, height: 70, resize: "vertical", marginBottom: 10 }} />
        <Lbl>NOTES</Lbl>
        <textarea value={form.notes} onChange={set("notes")} placeholder="Add a note…" style={{ ...inp, height: 70, resize: "vertical", marginBottom: 10 }} />

        {err && <div style={{ color: "#f87171", fontSize: 12, marginBottom: 10 }}>⚠ {err}</div>}

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, background: "#222222", color: "#aaaaaa", border: "1px solid #333333", borderRadius: 9, cursor: "pointer", fontSize: 13 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: 11, background: saving ? "#333333" : "#444444", color: "#ffffff", border: "none", borderRadius: 9, cursor: saving ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13 }}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, count, accent, emoji }) {
  return (
    <div style={{ background: "#141414", border: "1px solid #2a2a2a", borderRadius: 13, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: "#222", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{emoji}</div>
      <div>
        <div style={{ color: "#777", fontSize: 11, marginBottom: 2 }}>{label}</div>
        <div style={{ color: accent, fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{count}</div>
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) pages.push(i);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }
  const btn = (content, disabled, active, onClick) => (
    <button key={typeof content === "number" ? content : Math.random()} onClick={onClick} disabled={disabled}
      style={{ minWidth: 34, height: 34, borderRadius: 8, border: "none", background: active ? "#555555" : disabled ? "transparent" : "#222222", color: active ? "#fff" : disabled ? "#444444" : "#aaaaaa", fontSize: 13, fontWeight: active ? 700 : 400, cursor: disabled ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
      onMouseEnter={e => { if (!disabled && !active) e.currentTarget.style.background = "#333333"; }}
      onMouseLeave={e => { if (!disabled && !active) e.currentTarget.style.background = "#222222"; }}
    >{content}</button>
  );
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 28, flexWrap: "wrap" }}>
      {btn(<I.Prev />, page === 1, false, () => onChange(page - 1))}
      {pages.map((p, i) => p === "…" ? <span key={`e${i}`} style={{ color: "#555555", padding: "0 4px" }}>…</span> : btn(p, false, p === page, () => onChange(p)))}
      {btn(<I.Next />, page === totalPages, false, () => onChange(page + 1))}
    </div>
  );
}

function exportToExcel(leads) {
  const rows = leads.map((l, i) => ({
    "#": i + 1, "Project": l.project || "",
    "Full Name": l.fullName || "", "Mobile": l.mobileNumber || "", "Email": l.email || "",
    "Address": l.address || "", "City": l.city || "", "PIN Code": l.pinCode || "",
    "Property Type": l.propertyType || "", "Budget Range": l.budgetRange || "",
    "Visiting For": l.visitingFor || "", "Purpose": l.purposeOfPurchase || "",
    "Status": l.status || "", "Source": l.source || "",
    "Assigned To": l.assignedTo || "", "Will Buy In": l.willBuyIn || "",
    "Notes": l.notes || "",
    "Family": l.family || "", "Reason": l.reason || "", "Funding": l.funding || "",
    "Inventory Pitched": l.inventoryPitched || "", "Quotation": l.quotation || "",
    "Interested": l.interested || "", "Age Group": l.ageGroup || "",
    "Caste": l.caste || "", "Comments": l.comments || "",
    "Revisit Date": l.revisitDate || "", "Next Follow Up": l.nextFollowUp || "",
    "Heard About Us": Array.isArray(l.hearAboutUs) ? l.hearAboutUs.join(", ") : (l.hearAboutUs || ""),
    "CP Name": l.channelPartnerName || "", "CP Mobile": l.channelPartnerMobile || "",
    "Created At": l.createdAt ? new Date(l.createdAt).toLocaleString("en-IN") : "",
    "Updated At": l.updatedAt ? new Date(l.updatedAt).toLocaleString("en-IN") : "",
  }));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = Object.keys(rows[0] || {}).map(() => ({ wch: 18 }));
  XLSX.utils.book_append_sheet(wb, ws, "Leads");
  XLSX.writeFile(wb, `leads_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

function Flt({ label, value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ background: "#141414", border: "1px solid #333", color: value ? "#e0e0e0" : "#777", borderRadius: 9, padding: "8px 12px", fontSize: 13, cursor: "pointer", outline: "none", fontFamily: "inherit", flexShrink: 0 }}>
      <option value="">{label}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function AddProjectModal({ onClose, onAdded }) {
  const [projectName, setProjectName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const inp = {
    width: "100%", background: "#0d0d0d", border: "1px solid #333333",
    borderRadius: 9, padding: "10px 13px", color: "#e0e0e0",
    fontSize: 13, marginBottom: 16, boxSizing: "border-box", outline: "none",
    transition: "border-color .2s",
  };

  const handleSubmit = async () => {
    if (!projectName.trim()) { setErr("Project name is required."); return; }
    setSaving(true); setErr("");
    try {
      const res = await fetch(`${API_BASE}/projects`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName: projectName.trim(), location: location.trim(), description: description.trim() }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || `Server error ${res.status}`); }
      const newProject = await res.json();
      onAdded(newProject); onClose();
    } catch (e) { setErr(e.message); } finally { setSaving(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000c", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 700 }} onClick={onClose}>
      <div style={{ background: "#141414", border: "1px solid #333333", borderRadius: 18, padding: 32, width: 420, maxWidth: "96vw" }} onClick={e => e.stopPropagation()}>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#222222", border: "1px solid #444444", display: "flex", alignItems: "center", justifyContent: "center", color: "#aaaaaa" }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
          </div>
          <div>
            <div style={{ color: "#f0f0f0", fontWeight: 800, fontSize: 16 }}>Add New Project</div>
          </div>
        </div>

        <div style={{ color: "#888888", fontSize: 11, fontWeight: 600, letterSpacing: .4, marginBottom: 6 }}>PROJECT NAME <span style={{ color: "#ef4444" }}>*</span></div>
        <input value={projectName} onChange={e => { setProjectName(e.target.value); setErr(""); }} placeholder="e.g. Silver Serenity" autoFocus onKeyDown={e => e.key === "Enter" && handleSubmit()} style={{ ...inp, borderColor: err && !projectName.trim() ? "#ef4444" : "#333333" }} />

        <div style={{ color: "#888888", fontSize: 11, fontWeight: 600, letterSpacing: .4, marginBottom: 6 }}>LOCATION <span style={{ color: "#555555", fontWeight: 400 }}>(optional)</span></div>
        <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Mumbai, Maharashtra" style={inp} />

        <div style={{ color: "#888888", fontSize: 11, fontWeight: 600, letterSpacing: .4, marginBottom: 6 }}>DESCRIPTION <span style={{ color: "#555555", fontWeight: 400 }}>(optional)</span></div>
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description about this project…" style={{ ...inp, height: 72, resize: "vertical", marginBottom: 8 }} />

        {err && <div style={{ color: "#f87171", fontSize: 12, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}><span>⚠</span> {err}</div>}

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px", background: "#222222", color: "#aaaaaa", border: "1px solid #333333", borderRadius: 9, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving} style={{ flex: 2, padding: "11px", background: saving ? "#333333" : "#444444", color: "#fff", border: "none", borderRadius: 9, cursor: saving ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
            {saving ? "Saving…" : <><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg> Add Project</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LeadsDashboard({ currentUser, onLogout }) {
  const [leads, setLeads] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fCity, setFCity] = useState("");
  const [fProp, setFProp] = useState("");
  const [fProject, setFProject] = useState("");
  const [page, setPage] = useState(1);
  const [viewLead, setViewLead] = useState(null);
  const [editLead, setEditLead] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showUserMgmt, setShowUserMgmt] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/projects`).then(r => r.json()).then(d => setProjects(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);
  useEffect(() => {
    fetch(`${API_BASE}/users`).then(r => r.json()).then(d => setUsers(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const fetchLeads = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/leads`);
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const data = await res.json();
      setLeads(Array.isArray(data) ? data : data.leads || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);
  useEffect(() => { setPage(1); }, [search, fStatus, fCity, fProp, fProject]);
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") setViewLead(null); };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, []);

  const handleProjectAdded = (newProject) => setProjects(ps => [...ps, newProject]);
  const handleSave = (updated) => {
    setLeads(ls => ls.map(l => l._id === updated._id ? updated : l));
    if (viewLead?._id === updated._id) setViewLead(updated);
  };

  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    const ms = !q || [l.fullName, l.mobileNumber, l.email, l.city, l.address, l.propertyType, l.budgetRange, l.source, l.project].some(v => v?.toLowerCase().includes(q));
    const mp = !fProject || (l.project || "").trim().toLowerCase() === fProject.trim().toLowerCase();
    return ms && mp && (!fStatus || l.status === fStatus) && (!fCity || (l.city || "").trim().toLowerCase() === fCity.trim().toLowerCase()) && (!fProp || l.propertyType === fProp);
  });

  const scopedLeads = fProject ? leads.filter(l => (l.project || "").toLowerCase() === fProject.toLowerCase()) : leads;
  const total = scopedLeads.length;
  const newCount = scopedLeads.filter(l => l.status === "New").length;
  const converted = scopedLeads.filter(l => l.status === "Converted").length;
  const siteVisit = scopedLeads.filter(l => l.status === "Site Visit").length;

  const projectNames = projects.map(p => p.projectName);

  // Normalize city casing (e.g. "MUMBAI", "mumbai", "Mumbai" → "Mumbai") before deduplicating
  const toTitleCase = (s) => s.trim().replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  const cities = [...new Map(
    scopedLeads.map(l => l.city).filter(Boolean).map(c => [c.trim().toLowerCase(), toTitleCase(c)])
  ).values()].sort();

  const props = [...new Set(scopedLeads.map(l => l.propertyType).filter(Boolean))].sort();

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageLeads = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const anyFilter = search || fStatus || fCity || fProp || fProject;

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => { exportToExcel(anyFilter ? filtered : leads); setExporting(false); }, 100);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#e0e0e0", fontFamily: "'DM Sans','Segoe UI',sans-serif", padding: "16px clamp(12px,3vw,28px)" }}>
      <style>{`
        @media (min-width: 640px) {
          .dash-grid { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)) !important; }
          .stat-grid { grid-template-columns: repeat(4, 1fr) !important; }
          .action-row { flex-wrap: nowrap !important; }
          .filter-row { flex-direction: row !important; }
        }
        @media (max-width: 420px) {
          .action-btn-text { display: none !important; }
        }
        * { -webkit-tap-highlight-color: transparent; }
        input, select, textarea, button { font-family: 'DM Sans','Segoe UI',sans-serif !important; }
      `}</style>

      {/* ── TOP NAV BAR ─────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 10 }}>
        {/* Logo + Title */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <img src="/images/SilverGroupfaviconsondisplay.png" alt="Logo" style={{ height: 32, width: 32, borderRadius: 8, objectFit: "contain", flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#f0f0f0", letterSpacing: -0.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Leads Dashboard</div>
            <div style={{ color: "#555", fontSize: 11 }}>Silver Group</div>
          </div>
        </div>
        {/* Right: user chip + sign out */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#141414", border: "1px solid #2a2a2a", borderRadius: 9, padding: "5px 10px" }}>
            <button onClick={fetchLeads}
          style={{ background: "#1a1a1a", border: "1px solid #333", color: "#aaa", borderRadius: 9, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12, flexShrink: 0 }}>
          <I.Reload />
         </button>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", color: "#666", flexShrink: 0 }}>
              <I.User />
            </div>
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ color: "#cccccc", fontSize: 12, fontWeight: 700 }}>{currentUser?.name || currentUser?.username || "User"}</div>
              <div style={{ color: "#444", fontSize: 10 }}>{currentUser?.role === "admin" ? "Admin" : "User"}</div>
            </div>
          </div>
          <button onClick={onLogout} title="Sign out"
            style={{ background: "#1a0a0a", border: "1px solid #3a1a1a", color: "#ef4444", borderRadius: 9, padding: "7px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700 }}>
            <LogoutIcon /><span style={{ display: "none" }} className="show-sm">Sign Out</span>
          </button>
        </div>
      </div>

      {/* ── ACTION BUTTONS ROW ──────────────────────────────────── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <Flt label="All Projects" value={fProject} onChange={setFProject} options={projectNames} />
        <button onClick={handleExport} disabled={exporting || leads.length === 0}
          style={{ background: "#0f2a14", border: "1px solid #1a6a2a", color: "#4ade80", borderRadius: 9, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, opacity: exporting || leads.length === 0 ? .5 : 1, flexShrink: 0 }}>
          <I.Excel />
          <span>{exporting ? "Exporting…" : `Export ${anyFilter ? "Filtered" : "All"} (${anyFilter ? filtered.length : leads.length})`}</span>
        </button>
        <button onClick={() => setShowAddProject(true)}
          style={{ background: "#222", border: "1px solid #444", color: "#ccc", borderRadius: 9, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
          <I.Plus /> Add Project
        </button>
        {currentUser?.role === "admin" && (
          <button onClick={() => setShowUserMgmt(true)}
            style={{ background: "#1a1a2a", border: "1px solid #3730a3", color: "#818cf8", borderRadius: 9, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
            <I.User /> Add Users
          </button>
        )}
      </div>

      {/* ── STAT CARDS ──────────────────────────────────────────── */}
      <div className="stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 16 }}>
        <StatCard label="Total Leads" count={total} accent="#aaaaaa" emoji="📋" />
        <StatCard label="New Leads" count={newCount} accent="#fb923c" emoji="🆕" />
        <StatCard label="Converted" count={converted} accent="#4ade80" emoji="✅" />
        <StatCard label="Site Visits" count={siteVisit} accent="#38bdf8" emoji="🏗️" />
      </div>

      {/* ── SEARCH + FILTERS ────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#141414", border: "1px solid #333", borderRadius: 9, padding: "10px 14px" }}>
          <span style={{ color: "#555", flexShrink: 0 }}><I.Search /></span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, phone, city…"
            style={{ background: "none", border: "none", outline: "none", color: "#e0e0e0", fontSize: 13, width: "100%", fontFamily: "inherit" }} />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Flt label="All Status" value={fStatus} onChange={setFStatus} options={STATUS_LIST} />
          <Flt label="All Cities" value={fCity} onChange={setFCity} options={cities} />
          <Flt label="Property Type" value={fProp} onChange={setFProp} options={props} />
          {anyFilter && (
            <button onClick={() => { setSearch(""); setFStatus(""); setFCity(""); setFProp(""); setFProject(""); }}
              style={{ background: "none", border: "1px solid #ef444455", color: "#ef4444", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {!loading && !error && filtered.length > 0 && (
        <div style={{ color: "#444", fontSize: 11.5, marginBottom: 10 }}>💡 Tap any card to view all customer details</div>
      )}

      {loading && <div style={{ textAlign: "center", padding: "80px 0", color: "#666666" }}><div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>Fetching leads…</div>}

      {error && (
        <div style={{ background: "#200a0a", border: "1px solid #ef4444", borderRadius: 13, padding: 24, textAlign: "center", color: "#f87171" }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>⚠ Could not load leads</div>
          <div style={{ fontSize: 13 }}>{error}</div>
          <button onClick={fetchLeads} style={{ marginTop: 14, background: "#2a0a0a", border: "1px solid #ef4444", color: "#f87171", borderRadius: 8, padding: "8px 18px", cursor: "pointer" }}>Try Again</button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 6 }}>
            <div style={{ color: "#666666", fontSize: 12 }}>
              Showing <strong style={{ color: "#aaaaaa" }}>{pageLeads.length}</strong> of <strong style={{ color: "#aaaaaa" }}>{filtered.length}</strong> leads{anyFilter && " (filtered)"}
            </div>
            {totalPages > 1 && <div style={{ color: "#666666", fontSize: 12 }}>Page {safePage} of {totalPages}</div>}
          </div>

          {filtered.length === 0
            ? <div style={{ textAlign: "center", padding: "60px 0", color: "#666666" }}>
                {fProject ? `No leads found for "${fProject}". Run the mapping script if you just added this project.` : "No leads match your filters."}
              </div>
            : (
              <div className="dash-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 180px), 1fr))", gap: 10 }}>
                {pageLeads.map(lead => (
                  <LeadCard key={lead._id} lead={lead} onView={setViewLead} onUpdate={setEditLead} />
                ))}
              </div>
            )
          }

          <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
          {totalPages > 1 && <div style={{ textAlign: "center", color: "#555555", fontSize: 11.5, marginTop: 10 }}>{PAGE_SIZE} leads per page</div>}
        </>
      )}

      {viewLead && <DetailDrawer lead={viewLead} onClose={() => setViewLead(null)} onEdit={(l) => { setViewLead(null); setEditLead(l); }} />}
      {showAddProject && <AddProjectModal onClose={() => setShowAddProject(false)} onAdded={handleProjectAdded} />}
      {editLead && <UpdateModal lead={editLead} projects={projects} users={users} onClose={() => setEditLead(null)} onSave={handleSave} />}
      {showUserMgmt && currentUser && <UserManagementModal currentUser={currentUser} onClose={() => setShowUserMgmt(false)} />}
    </div>
  );
}

const LogoutIcon = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
