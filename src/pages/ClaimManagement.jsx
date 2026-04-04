import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const claimLifecycle = [
  { key: "fnol", label: "FNOL", helper: "First notice captured" },
  { key: "triage", label: "Triage", helper: "Risk + severity scoring" },
  { key: "investigation", label: "Investigation", helper: "Evidence and validation" },
  { key: "decision", label: "Decision", helper: "Approve / reject / request info" },
  { key: "settlement", label: "Settlement", helper: "Payout and recovery" },
  { key: "closure", label: "Closure", helper: "Audit-ready completion" },
];

const statusToneMap = {
  Pending: "submitted",
  Processing: "review",
  Submitted: "submitted",
  "In Review": "review",
  "More Info Needed": "attention",
  Approved: "approved",
  Settled: "approved",
  Rejected: "rejected",
};

function ClaimManagement() {
  const [claimItems, setClaimItems] = useState([]);
  const [activeClaimId, setActiveClaimId] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [quickNote, setQuickNote] = useState("");
  const [quickDocName, setQuickDocName] = useState("");

  const userProfile = useMemo(() => {
    const profile = localStorage.getItem("userProfile");
    return profile ? JSON.parse(profile) : null;
  }, []);

  const [newClaimDraft, setNewClaimDraft] = useState({
    incidentType: "Weather Damage",
    incidentDate: "",
    location: "",
    amount: "",
    notes: "",
  });

  useEffect(() => {
    let mounted = true;

    const loadClaims = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const query = userProfile?.uid ? `?uid=${userProfile.uid}` : "";
        const { data } = await axios.get(`/api/claims${query}`);
        if (!mounted) return;

        setClaimItems(Array.isArray(data) ? data : []);
        if (data?.length) {
          setActiveClaimId(data[0].claimId);
        }
      } catch (error) {
        if (!mounted) return;
        setErrorMessage(error?.response?.data?.message || "Failed to load claims");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadClaims();

    return () => {
      mounted = false;
    };
  }, [userProfile?.uid]);

  const selectedClaim = useMemo(
    () => claimItems.find((claim) => claim.claimId === activeClaimId) || claimItems[0],
    [activeClaimId, claimItems]
  );

  const selectedTimeline = useMemo(() => {
    if (!selectedClaim?.timeline) return [];

    return [...selectedClaim.timeline]
      .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())
      .map((entry) => entry.message || "Activity updated");
  }, [selectedClaim]);

  const claimAnalytics = useMemo(() => {
    const totalClaims = claimItems.length;
    const openClaims = claimItems.filter((claim) => !["Approved", "Settled", "Rejected"].includes(claim.status)).length;

    const decidedClaims = claimItems.filter((claim) => ["Approved", "Settled", "Rejected"].includes(claim.status));
    const approvedClaims = claimItems.filter((claim) => ["Approved", "Settled"].includes(claim.status));
    const approvalRate = decidedClaims.length
      ? Math.round((approvedClaims.length / decidedClaims.length) * 100)
      : 0;

    const responseHours = claimItems
      .map((claim) => {
        const createdAt = new Date(claim.createdAt || 0).getTime();
        const timeline = Array.isArray(claim.timeline) ? claim.timeline : [];
        const firstResponse = timeline.find((entry) => entry.eventType && entry.eventType !== "fnol");
        const firstResponseTime = firstResponse ? new Date(firstResponse.createdAt || 0).getTime() : null;

        if (!createdAt || !firstResponseTime || firstResponseTime < createdAt) {
          return null;
        }

        return (firstResponseTime - createdAt) / (1000 * 60 * 60);
      })
      .filter((value) => typeof value === "number");

    const avgResponseHours = responseHours.length
      ? responseHours.reduce((sum, value) => sum + value, 0) / responseHours.length
      : null;

    const fraudFlags = claimItems.filter((claim) => {
      const searchable = `${claim.incidentType || ""} ${claim.reason || ""}`.toLowerCase();
      return searchable.includes("fraud") || searchable.includes("theft") || searchable.includes("suspicious");
    }).length;

    return {
      totalClaims,
      openClaims,
      approvalRate,
      avgResponseHours,
      fraudFlags,
    };
  }, [claimItems]);

  const completedDocs = selectedClaim?.documents?.filter((item) => item.uploaded).length || 0;

  const onDraftChange = (event) => {
    const { name, value } = event.target;
    setNewClaimDraft((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const refreshClaim = async (claimId) => {
    const { data } = await axios.get(`/api/claims/${claimId}`);
    setClaimItems((previous) => previous.map((claim) => (claim.claimId === claimId ? data : claim)));
  };

  const submitNewClaim = async () => {
    if (!newClaimDraft.incidentDate || !newClaimDraft.amount || !newClaimDraft.notes.trim()) {
      setErrorMessage("Incident date, amount, and description are required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const payload = {
        incidentType: newClaimDraft.incidentType,
        incidentDate: newClaimDraft.incidentDate,
        date: newClaimDraft.incidentDate,
        location: newClaimDraft.location,
        amount: Number(newClaimDraft.amount),
        reason: newClaimDraft.notes,
        notes: newClaimDraft.notes,
        status: "Submitted",
        currentStep: "fnol",
        userUid: userProfile?.uid || "",
      };

      const { data } = await axios.post("/api/claims", payload);
      setClaimItems((previous) => [data, ...previous]);
      setActiveClaimId(data.claimId);
      setNewClaimDraft({
        incidentType: "Weather Damage",
        incidentDate: "",
        location: "",
        amount: "",
        notes: "",
      });
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || "Failed to submit claim");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addQuickNote = async () => {
    if (!selectedClaim || !quickNote.trim()) return;

    try {
      await axios.post(`/api/claims/${selectedClaim.claimId}/notes`, {
        message: quickNote.trim(),
        actor: "claimant",
      });
      await refreshClaim(selectedClaim.claimId);
      setQuickNote("");
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || "Failed to add note");
    }
  };

  const addQuickDocument = async () => {
    if (!selectedClaim || !quickDocName.trim()) return;

    try {
      await axios.post(`/api/claims/${selectedClaim.claimId}/documents`, {
        name: quickDocName.trim(),
        uploadedBy: "claimant",
      });
      await refreshClaim(selectedClaim.claimId);
      setQuickDocName("");
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || "Failed to add document");
    }
  };

  const applyDecision = async (decision) => {
    if (!selectedClaim) return;

    try {
      await axios.post(`/api/claims/${selectedClaim.claimId}/decision`, {
        decision,
        actor: "adjuster",
      });
      await refreshClaim(selectedClaim.claimId);
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || "Failed to set decision");
    }
  };

  const settleClaim = async () => {
    if (!selectedClaim) return;

    try {
      await axios.post(`/api/claims/${selectedClaim.claimId}/settlement`, {
        method: "Direct Deposit",
        reference: `SET-${Date.now()}`,
        actor: "finance",
      });
      await refreshClaim(selectedClaim.claimId);
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || "Failed to settle claim");
    }
  };

  if (loading) {
    return (
      <div className="claims-container">
        <div className="card">
          <h2>Claim Management</h2>
          <p className="claims-subtitle">Loading claims...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="claims-container">
      <div className="card">
        <h2>Claim Management</h2>
        <p className="claims-subtitle">
          Built around a modern lifecycle: fast intake, clear status, low-friction evidence collection,
          and transparent settlement updates.
        </p>

        {errorMessage ? <p className="claims-error-banner">{errorMessage}</p> : null}

        <div className="claims-kpi-grid">
          <article className="claims-kpi">
            <p>Open Claims</p>
            <h3>{claimAnalytics.openClaims}</h3>
            <span>{claimAnalytics.totalClaims} total claims</span>
          </article>
          <article className="claims-kpi">
            <p>Avg. First Response</p>
            <h3>
              {claimAnalytics.avgResponseHours === null
                ? "--"
                : `${Math.round(claimAnalytics.avgResponseHours)}h`}
            </h3>
            <span>Based on timeline events</span>
          </article>
          <article className="claims-kpi">
            <p>Approval Rate</p>
            <h3>{claimAnalytics.approvalRate}%</h3>
            <span>From decided claims</span>
          </article>
          <article className="claims-kpi">
            <p>Fraud Flags</p>
            <h3>{claimAnalytics.fraudFlags}</h3>
            <span>Keyword-based detection</span>
          </article>
        </div>

        <div className="claims-main-grid">
          <section className="claim-list-panel">
            <div className="claims-section-header">
              <h3>My Claims</h3>
              <button className="mini-btn" type="button">Export</button>
            </div>

            <div className="claim-list">
              {claimItems.length === 0 ? <p>No claims yet. File one below.</p> : null}
              {claimItems.map((claim) => (
                <button
                  type="button"
                  key={claim.claimId}
                  className={`claim-list-item ${activeClaimId === claim.claimId ? "active" : ""}`}
                  onClick={() => setActiveClaimId(claim.claimId)}
                >
                  <div>
                    <strong>{claim.claimId}</strong>
                    <p>{claim.incidentType}</p>
                  </div>
                  <div className="claim-list-meta">
                    <span className={`claim-tag ${statusToneMap[claim.status]}`}>{claim.status}</span>
                    <small>₹{claim.amount}</small>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="claim-detail-panel">
            {!selectedClaim ? <p>Select a claim to see details.</p> : null}
            {selectedClaim ? (
              <>
            <div className="claims-section-header">
              <h3>{selectedClaim.claimId}</h3>
              <span className={`claim-tag ${statusToneMap[selectedClaim.status]}`}>{selectedClaim.status}</span>
            </div>

            <div className="claim-detail-summary">
              <div>
                <p className="detail-label">Incident</p>
                <strong>{selectedClaim.incidentType}</strong>
              </div>
              <div>
                <p className="detail-label">Filed on</p>
                <strong>{selectedClaim.date}</strong>
              </div>
              <div>
                <p className="detail-label">Priority</p>
                <strong>{selectedClaim.priority}</strong>
              </div>
              <div>
                <p className="detail-label">SLA</p>
                <strong>{selectedClaim.sla}</strong>
              </div>
            </div>

            <div className="claim-lifecycle-track" role="list" aria-label="Claim lifecycle">
              {claimLifecycle.map((step, index) => {
                const activeIndex = claimLifecycle.findIndex((entry) => entry.key === selectedClaim.currentStep);
                const stateClass = index < activeIndex ? "done" : index === activeIndex ? "current" : "pending";

                return (
                  <div key={step.key} className={`lifecycle-step ${stateClass}`} role="listitem">
                    <span className="step-dot" aria-hidden="true"></span>
                    <div>
                      <strong>{step.label}</strong>
                      <p>{step.helper}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="claims-dual-grid">
              <article className="claims-note-card">
                <h4>Evidence Checklist</h4>
                <p>{completedDocs}/{selectedClaim.documents.length} files uploaded</p>
                <ul>
                  {selectedClaim.documents.map((document) => (
                    <li key={document.name} className={document.uploaded ? "uploaded" : "missing"}>
                      {document.uploaded ? "✓" : "•"} {document.name}
                    </li>
                  ))}
                </ul>
                <div className="quick-inline-actions">
                  <input
                    type="text"
                    placeholder="Add document name"
                    value={quickDocName}
                    onChange={(event) => setQuickDocName(event.target.value)}
                  />
                  <button type="button" className="mini-btn" onClick={addQuickDocument}>Add</button>
                </div>
              </article>

              <article className="claims-note-card">
                <h4>Activity Timeline</h4>
                <ul>
                  {selectedTimeline.map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ul>
                <div className="quick-inline-actions">
                  <input
                    type="text"
                    placeholder="Add note"
                    value={quickNote}
                    onChange={(event) => setQuickNote(event.target.value)}
                  />
                  <button type="button" className="mini-btn" onClick={addQuickNote}>Add</button>
                </div>
              </article>
            </div>

            <div className="claim-action-row">
              <button className="mini-btn" type="button" onClick={() => applyDecision("More Info Needed")}>Need Info</button>
              <button className="mini-btn" type="button" onClick={() => applyDecision("Approved")}>Approve</button>
              <button className="mini-btn" type="button" onClick={() => applyDecision("Rejected")}>Reject</button>
              <button className="mini-btn" type="button" onClick={settleClaim}>Settle</button>
            </div>
            </>
            ) : null}
          </section>
        </div>

        <section className="new-claim-panel">
          <div className="claims-section-header">
            <h3>File New Claim (FNOL)</h3>
            <span className="claim-hint">Wizard-ready intake with clear guidance</span>
          </div>

          <div className="claim-form-grid">
            <label>
              Incident Type
              <select
                name="incidentType"
                value={newClaimDraft.incidentType}
                onChange={onDraftChange}
              >
                <option>Weather Damage</option>
                <option>Accident</option>
                <option>Medical Emergency</option>
                <option>Theft / Fraud</option>
              </select>
            </label>

            <label>
              Incident Date
              <input
                type="date"
                name="incidentDate"
                value={newClaimDraft.incidentDate}
                onChange={onDraftChange}
              />
            </label>

            <label>
              Location
              <input
                type="text"
                name="location"
                placeholder="Area / City"
                value={newClaimDraft.location}
                onChange={onDraftChange}
              />
            </label>

            <label>
              Estimated Amount
              <input
                type="number"
                name="amount"
                placeholder="₹"
                min="0"
                value={newClaimDraft.amount}
                onChange={onDraftChange}
              />
            </label>
          </div>

          <label className="claim-notes-field">
            Description
            <textarea
              name="notes"
              rows="4"
              placeholder="Add what happened, rider safety impact, and document references..."
              value={newClaimDraft.notes}
              onChange={onDraftChange}
            ></textarea>
          </label>

          <div className="insurance-actions">
            <button className="action-btn" type="button" disabled>Save Draft</button>
            <button className="action-btn primary" type="button" onClick={submitNewClaim} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Claim"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ClaimManagement;
