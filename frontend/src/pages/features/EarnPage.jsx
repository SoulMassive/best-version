import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { api, fetcher } from "../../api/client";
import { Button, Card, EmptyState, Field, LoadingState, SectionHeader } from "../../components/ui/UI";

const TYPES = ["all", "freelance", "internship", "job"];
const TYPE_LABELS = { freelance: "Freelance", internship: "Internship", job: "Full-Time" };
const TYPE_COLORS = { freelance: "var(--brand)", internship: "var(--accent)", job: "#6366f1" };

function ApplyModal({ job, reusablePitch, onClose, onSuccess }) {
  const [pitch, setPitch] = useState(reusablePitch || "");
  const mutation = useMutation({
    mutationFn: () => api.post(`/opportunities/freelance/${job._id}/apply`, { proposal: pitch }),
    onSuccess: () => { toast.success("Application submitted ✓"); onSuccess(); onClose(); },
    onError: (err) => toast.error(err?.response?.data?.message || "Application failed"),
  });
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box card" onClick={(e) => e.stopPropagation()}>
        <SectionHeader eyebrow="Apply Now" title={job.title} description={`${job.company} · ${job.location}`} />
        <Field label="Your Pitch / Cover Note" value={pitch} onChange={(e) => setPitch(e.target.value)} textarea placeholder="Briefly explain why you're a great fit..." />
        <div className="row-actions" style={{ marginTop: "0.75rem" }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!pitch.trim() || mutation.isPending}>
            {mutation.isPending ? "Submitting..." : "Submit Application"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function EarnPage() {
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState("all");
  const [tab, setTab] = useState("browse");
  const [applyTarget, setApplyTarget] = useState(null);

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["freelance-jobs", typeFilter],
    queryFn: () => fetcher("/opportunities/freelance", { params: { type: typeFilter } }),
  });

  const { data: applicationsData } = useQuery({
    queryKey: ["applications"],
    queryFn: () => fetcher("/opportunities/applications"),
  });

  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: () => fetcher("/profile/settings"),
  });

  if (isLoading) return <LoadingState label="Loading opportunities..." />;

  const wallet = applicationsData?.wallet;
  const applications = applicationsData?.applications || [];
  const byStatus = { pending: [], shortlisted: [], applied: [], accepted: [], rejected: [] };
  applications.forEach((a) => { const s = a.status || "applied"; (byStatus[s] || byStatus.applied).push(a); });

  return (
    <div className="stack-xl">
      {/* Stats */}
      <section className="stats-grid">
        <div className="stat"><span>Wallet balance</span><strong>${wallet?.balance || 0}</strong></div>
        <div className="stat"><span>Pending payouts</span><strong>${wallet?.pending || 0}</strong></div>
        <div className="stat"><span>Applications</span><strong>{applications.length}</strong></div>
      </section>

      <div className="tab-row">
        <button className={`tab ${tab === "browse" ? "tab-active" : ""}`} onClick={() => setTab("browse")} type="button">Browse Opportunities</button>
        <button className={`tab ${tab === "mine" ? "tab-active" : ""}`} onClick={() => setTab("mine")} type="button">My Applications ({applications.length})</button>
      </div>

      {tab === "browse" && (
        <>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {TYPES.map((t) => (
              <button
                key={t}
                className={`tab ${typeFilter === t ? "tab-active" : ""}`}
                onClick={() => setTypeFilter(t)}
                type="button"
                style={typeFilter === t && t !== "all" ? { background: TYPE_COLORS[t], color: "#fff" } : {}}
              >
                {t === "all" ? "All" : TYPE_LABELS[t]}
              </button>
            ))}
          </div>
          <div className="stack">
            {(jobs || []).length === 0 ? (
              <EmptyState title="No opportunities found" description="Try a different filter." />
            ) : (
              (jobs || []).map((job) => (
                <Card key={job._id}>
                  <div className="list-row">
                    <div>
                      <h3>{job.title}</h3>
                      <p>{job.company} · {job.location} · {job.budget}</p>
                    </div>
                    <span className="pill" style={{ background: TYPE_COLORS[job.type] || "var(--brand)", color: "#fff" }}>
                      {TYPE_LABELS[job.type] || job.type}
                    </span>
                  </div>
                  <p style={{ margin: "0.5rem 0" }}>{job.description}</p>
                  <div className="tag-row">
                    {(job.skills || []).map((skill) => <span key={skill} className="pill muted">{skill}</span>)}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.75rem" }}>
                    <small style={{ color: "var(--text-soft)" }}>Deadline: {new Date(job.deadline).toLocaleDateString()}</small>
                    <Button
                      disabled={Boolean(job.applicationStatus)}
                      onClick={() => setApplyTarget(job)}
                    >
                      {job.applicationStatus ? `Applied ✓` : "Apply Now"}
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </>
      )}

      {tab === "mine" && (
        applications.length === 0 ? (
          <EmptyState title="No applications yet" description="Browse opportunities and hit Apply Now to get started." />
        ) : (
          <div className="grid-three" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            {["applied", "shortlisted", "accepted", "rejected"].map((status) => (
              <div key={status} className="stack">
                <SectionHeader eyebrow={status.charAt(0).toUpperCase() + status.slice(1)} title="" />
                {byStatus[status].length === 0 ? <p style={{ fontSize: "0.85rem", color: "var(--text-soft)" }}>None</p> :
                  byStatus[status].map((item) => (
                    <Card key={item._id}>
                      <strong>{item.job?.title}</strong>
                      <p>{item.job?.company}</p>
                      <span className="pill" style={{ marginTop: "0.3rem" }}>{item.status}</span>
                    </Card>
                  ))
                }
              </div>
            ))}
          </div>
        )
      )}

      {applyTarget && (
        <ApplyModal
          job={applyTarget}
          reusablePitch={settingsData?.reusablePitch || ""}
          onClose={() => setApplyTarget(null)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["freelance-jobs", typeFilter] })}
        />
      )}
    </div>
  );
}
