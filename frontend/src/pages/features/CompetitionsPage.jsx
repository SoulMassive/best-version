import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { api, fetcher } from "../../api/client";
import { Button, Card, EmptyState, Field, LoadingState, SectionHeader } from "../../components/ui/UI";

function Countdown({ deadline }) {
  const ms = new Date(deadline) - Date.now();
  if (ms <= 0) return <span className="pill" style={{ background: "var(--danger)", color: "#fff" }}>Closed</span>;
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  return <span className="pill">{days}d {hours}h left</span>;
}

function SubmitModal({ competition, onClose, onSuccess }) {
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: () => api.post(`/opportunities/competitions/${competition._id}/submit`, { submissionUrl: url, notes }),
    onSuccess: () => { toast.success("Submission received! ✓"); onSuccess(); onClose(); },
    onError: (err) => toast.error(err?.response?.data?.message || "Submission failed"),
  });

  const isPast = competition.status === "past" || new Date(competition.deadline) < Date.now();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box card" onClick={(e) => e.stopPropagation()}>
        <SectionHeader eyebrow="Submit Work" title={competition.title} />
        {isPast ? (
          <p>The deadline for this competition has passed.</p>
        ) : competition.hasSubmitted ? (
          <p>✓ You have already submitted to this competition.</p>
        ) : (
          <div className="stack">
            <Field label="Submission URL" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://your-project.com" />
            <Field label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} textarea placeholder="Describe what you built..." />
            <Button onClick={() => mutation.mutate()} disabled={!url || mutation.isPending}>
              {mutation.isPending ? "Submitting..." : "Submit Work"}
            </Button>
          </div>
        )}
        <Button variant="ghost" onClick={onClose} style={{ marginTop: "0.5rem" }}>Close</Button>
      </div>
    </div>
  );
}

export function CompetitionsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["competitions"],
    queryFn: () => fetcher("/opportunities/competitions"),
  });

  const joinMutation = useMutation({
    mutationFn: (id) => api.post(`/opportunities/competitions/${id}/join`),
    onSuccess: () => {
      toast.success("Joined competition");
      queryClient.invalidateQueries({ queryKey: ["competitions"] });
    },
  });

  if (isLoading) return <LoadingState label="Loading competitions..." />;

  const filtered = statusFilter === "all" ? data : data.filter((c) => c.status === statusFilter);

  const statusColors = { active: "var(--brand)", upcoming: "var(--accent)", past: "var(--text-soft)" };

  return (
    <div className="stack-xl">
      <SectionHeader eyebrow="Compete" title="Challenges, sprints & prizes"
        action={
          <div className="tab-row">
            {["all", "active", "upcoming", "past"].map((s) => (
              <button key={s} className={`tab ${statusFilter === s ? "tab-active" : ""}`} onClick={() => setStatusFilter(s)} type="button">
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState title="No competitions found" description="Try a different filter." />
      ) : (
        <div className="course-grid">
          {filtered.map((item) => (
            <Card key={item._id} className="course-card">
              {item.coverImage && <img src={item.coverImage} alt={item.title} className="cover-image" />}
              <div className="meta-row" style={{ marginTop: "0.5rem" }}>
                <span className="pill" style={{ background: statusColors[item.status], color: "#fff" }}>{item.status}</span>
                <span className="pill muted">{item.category}</span>
                {item.status !== "past" && <Countdown deadline={item.deadline} />}
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              {item.brief && (
                <details>
                  <summary style={{ cursor: "pointer", fontWeight: 700, color: "var(--brand-dark)", fontSize: "0.9rem" }}>View full brief</summary>
                  <p style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>{item.brief}</p>
                </details>
              )}
              <div className="meta-row" style={{ marginTop: "0.75rem" }}>
                <strong style={{ color: "var(--brand-dark)" }}>{item.prize}</strong>
                <span>{item.submissionCount || 0} submissions</span>
              </div>
              <div className="row-actions" style={{ marginTop: "0.75rem" }}>
                {!item.isParticipant && item.status !== "past" && (
                  <Button variant="secondary" onClick={() => joinMutation.mutate(item._id)}>Join</Button>
                )}
                {item.hasSubmitted ? (
                  <Button disabled variant="secondary">Submitted ✓</Button>
                ) : (
                  <Button disabled={item.status === "past"} onClick={() => setSelected(item)}>
                    {item.status === "past" ? "Closed" : "Submit Work"}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {selected && (
        <SubmitModal
          competition={selected}
          onClose={() => setSelected(null)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["competitions"] })}
        />
      )}
    </div>
  );
}
