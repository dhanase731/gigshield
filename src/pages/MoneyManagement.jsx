import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const defaultAllocations = {
  needs: 50,
  wants: 20,
  savings: 20,
  protection: 10,
};

const isFinalClaim = (status) => ["Approved", "Settled", "Rejected"].includes(status);

function MoneyManagement() {
  const [monthlyIncome, setMonthlyIncome] = useState(() => {
    const value = localStorage.getItem("moneyMonthlyIncome");
    return value ? Number(value) : 30000;
  });
  const [allocations, setAllocations] = useState(() => {
    const value = localStorage.getItem("moneyAllocations");
    return value ? JSON.parse(value) : defaultAllocations;
  });
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userProfile = useMemo(() => {
    const profile = localStorage.getItem("userProfile");
    return profile ? JSON.parse(profile) : null;
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadClaims = async () => {
      setLoading(true);
      setError("");

      try {
        const query = userProfile?.uid ? `?uid=${userProfile.uid}` : "";
        const { data } = await axios.get(`/api/claims${query}`);
        if (!mounted) return;
        setClaims(Array.isArray(data) ? data : []);
      } catch (fetchError) {
        if (!mounted) return;
        setError(fetchError?.response?.data?.message || "Failed to load money insights");
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

  useEffect(() => {
    localStorage.setItem("moneyMonthlyIncome", String(monthlyIncome || 0));
  }, [monthlyIncome]);

  useEffect(() => {
    localStorage.setItem("moneyAllocations", JSON.stringify(allocations));
  }, [allocations]);

  const claimInsights = useMemo(() => {
    const openClaims = claims.filter((claim) => !isFinalClaim(claim.status));
    const settledClaims = claims.filter((claim) => ["Approved", "Settled"].includes(claim.status));

    const openExposure = openClaims.reduce((sum, claim) => sum + Number(claim.amount || 0), 0);
    const settledAmount = settledClaims.reduce((sum, claim) => sum + Number(claim.amount || 0), 0);

    const reserveTarget = Math.round(openExposure * 0.3);
    const reserveAvailable = Math.round(monthlyIncome * (allocations.protection / 100));

    return {
      openExposure,
      settledAmount,
      reserveTarget,
      reserveAvailable,
      reserveCoverage: reserveTarget > 0 ? Math.min(100, Math.round((reserveAvailable / reserveTarget) * 100)) : 100,
      openClaimCount: openClaims.length,
    };
  }, [allocations.protection, claims, monthlyIncome]);

  const budgetBuckets = useMemo(() => {
    const income = Number(monthlyIncome || 0);

    return {
      needs: Math.round((income * allocations.needs) / 100),
      wants: Math.round((income * allocations.wants) / 100),
      savings: Math.round((income * allocations.savings) / 100),
      protection: Math.round((income * allocations.protection) / 100),
    };
  }, [allocations, monthlyIncome]);

  const onAllocationChange = (key, value) => {
    const numeric = Number(value);
    setAllocations((previous) => ({
      ...previous,
      [key]: Number.isNaN(numeric) ? 0 : Math.max(0, Math.min(100, numeric)),
    }));
  };

  const totalAllocation = allocations.needs + allocations.wants + allocations.savings + allocations.protection;
  const allocationBalanced = totalAllocation === 100;

  return (
    <div className="money-container">
      <div className="card">
        <h2>Money Management</h2>
        <p className="claims-subtitle">
          Plan your monthly cashflow, keep claim reserves ready, and protect emergency runway without stress.
        </p>

        {error ? <p className="claims-error-banner">{error}</p> : null}

        <div className="money-top-grid">
          <article className="claims-kpi">
            <p>Monthly Income</p>
            <h3>₹{monthlyIncome}</h3>
            <span>Editable baseline for planning</span>
          </article>
          <article className="claims-kpi">
            <p>Open Claim Exposure</p>
            <h3>₹{claimInsights.openExposure}</h3>
            <span>{claimInsights.openClaimCount} active claims</span>
          </article>
          <article className="claims-kpi">
            <p>Reserve Coverage</p>
            <h3>{claimInsights.reserveCoverage}%</h3>
            <span>Target: ₹{claimInsights.reserveTarget}</span>
          </article>
          <article className="claims-kpi">
            <p>Settled Claim Payout</p>
            <h3>₹{claimInsights.settledAmount}</h3>
            <span>Approved + settled claims</span>
          </article>
        </div>

        <section className="new-claim-panel">
          <div className="claims-section-header">
            <h3>Budget Split</h3>
            <span className="claim-hint">Use a balanced percentage split (must equal 100%)</span>
          </div>

          <div className="money-input-grid">
            <label>
              Monthly Income
              <input
                type="number"
                min="0"
                value={monthlyIncome}
                onChange={(event) => setMonthlyIncome(Math.max(0, Number(event.target.value || 0)))}
              />
            </label>
            <label>
              Needs %
              <input
                type="number"
                min="0"
                max="100"
                value={allocations.needs}
                onChange={(event) => onAllocationChange("needs", event.target.value)}
              />
            </label>
            <label>
              Wants %
              <input
                type="number"
                min="0"
                max="100"
                value={allocations.wants}
                onChange={(event) => onAllocationChange("wants", event.target.value)}
              />
            </label>
            <label>
              Savings %
              <input
                type="number"
                min="0"
                max="100"
                value={allocations.savings}
                onChange={(event) => onAllocationChange("savings", event.target.value)}
              />
            </label>
            <label>
              Protection Reserve %
              <input
                type="number"
                min="0"
                max="100"
                value={allocations.protection}
                onChange={(event) => onAllocationChange("protection", event.target.value)}
              />
            </label>
          </div>

          {!allocationBalanced ? (
            <p className="claims-error-banner">Your allocation totals {totalAllocation}%. Please set it to 100%.</p>
          ) : (
            <p className="money-ok-banner">Allocation is balanced at 100%.</p>
          )}

          <div className="money-bucket-grid">
            <article className="claims-note-card">
              <h4>Needs</h4>
              <p>₹{budgetBuckets.needs}</p>
            </article>
            <article className="claims-note-card">
              <h4>Wants</h4>
              <p>₹{budgetBuckets.wants}</p>
            </article>
            <article className="claims-note-card">
              <h4>Savings</h4>
              <p>₹{budgetBuckets.savings}</p>
            </article>
            <article className="claims-note-card">
              <h4>Protection Reserve</h4>
              <p>₹{budgetBuckets.protection}</p>
            </article>
          </div>
        </section>

        <section className="new-claim-panel">
          <div className="claims-section-header">
            <h3>Insurance + Money Actions</h3>
            <span className="claim-hint">Inspired by claim-payment and financial safety best practices</span>
          </div>

          <div className="money-actions-list">
            <div>
              <strong>1) Keep reserve liquid</strong>
              <p>Maintain protection reserve in an account you can access quickly during emergencies.</p>
            </div>
            <div>
              <strong>2) Separate settlement money</strong>
              <p>When claims are paid, split instantly into repairs, debt, and emergency fund top-up.</p>
            </div>
            <div>
              <strong>3) Automate monthly transfers</strong>
              <p>Auto-transfer savings and reserve allocations on paydays to reduce decision fatigue.</p>
            </div>
          </div>
        </section>

        {loading ? <p className="claims-subtitle">Refreshing financial insights...</p> : null}
      </div>
    </div>
  );
}

export default MoneyManagement;
