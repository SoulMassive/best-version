import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { api, fetcher } from "../../api/client";
import { Button, Card, EmptyState, Field, LoadingState, SectionHeader } from "../../components/ui/UI";

const STAGES = ["Concept", "Validation", "Building", "Launched"];

const emptyForm = { title: "", problem: "", solution: "", targetAudience: "", revenueModel: "", stage: "Concept", tags: "", isPublic: false };

function IdeaForm({ initial = emptyForm, onSave, onCancel, isLoading }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initial);
  const f = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <Card>
      <SectionHeader eyebrow={`Step ${step} of 3`} title={["Problem & Solution", "Audience & Revenue", "Stage & Tags"][step - 1]} />
      <div className="stack">
        {step === 1 && (
          <>
            <Field label="Idea Title *" value={form.title} onChange={f("title")} placeholder="e.g. SkillSwap Campus" />
            <Field label="The Problem *" value={form.problem} onChange={f("problem")} textarea placeholder="What pain point does this solve?" />
            <Field label="Your Solution *" value={form.solution} onChange={f("solution")} textarea placeholder="How does your idea solve it?" />
          </>
        )}
        {step === 2 && (
          <>
            <Field label="Target Audience" value={form.targetAudience} onChange={f("targetAudience")} placeholder="Who is this for?" />
            <Field label="Revenue Model" value={form.revenueModel} onChange={f("revenueModel")} placeholder="How will it make money?" />
          </>
        )}
        {step === 3 && (
          <>
            <label className="field">
              <span>Stage</span>
              <select value={form.stage} onChange={f("stage")}>
                {STAGES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <Field label="Tags (comma-separated)" value={form.tags} onChange={f("tags")} placeholder="EdTech, AI, B2C" />
            <label className="toggle-row">
              <span>Make this idea public</span>
              <input type="checkbox" checked={form.isPublic} onChange={(e) => setForm({ ...form, isPublic: e.target.checked })} />
            </label>
          </>
        )}
        <div className="row-actions">
          {step > 1 && <Button variant="ghost" onClick={() => setStep(step - 1)}>Back</Button>}
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          {step < 3
            ? <Button onClick={() => setStep(step + 1)} disabled={step === 1 && (!form.title || !form.problem || !form.solution)}>Next</Button>
            : <Button onClick={() => onSave({ ...form, tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean) })} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Idea"}
              </Button>
          }
        </div>
      </div>
    </Card>
  );
}

const STAGE_COLORS = { Concept: "var(--text-soft)", Validation: "var(--accent)", Building: "var(--brand)", Launched: "#22c55e" };

export function StartupIdeasPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("mine");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: myIdeas, isLoading: loadingMine } = useQuery({
    queryKey: ["startup-ideas-mine"],
    queryFn: () => fetcher("/opportunities/startups/mine"),
  });
  const { data: publicIdeas, isLoading: loadingPublic } = useQuery({
    queryKey: ["startup-ideas-public"],
    queryFn: () => fetcher("/opportunities/startups/public"),
    enabled: tab === "community",
  });

  const createMutation = useMutation({
    mutationFn: (payload) => api.post("/opportunities/startups", payload),
    onSuccess: () => { toast.success("Idea saved!"); setShowForm(false); queryClient.invalidateQueries({ queryKey: ["startup-ideas-mine"] }); },
    onError: (err) => toast.error(err?.response?.data?.message || "Error saving idea"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => api.put(`/opportunities/startups/${id}`, payload),
    onSuccess: () => { toast.success("Idea updated"); setEditing(null); queryClient.invalidateQueries({ queryKey: ["startup-ideas-mine"] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/opportunities/startups/${id}`),
    onSuccess: () => { toast.success("Idea deleted"); queryClient.invalidateQueries({ queryKey: ["startup-ideas-mine"] }); },
  });

  const visibilityMutation = useMutation({
    mutationFn: (id) => api.patch(`/opportunities/startups/${id}/visibility`),
    onSuccess: () => { toast.success("Visibility updated"); queryClient.invalidateQueries({ queryKey: ["startup-ideas-mine"] }); },
  });

  return (
    <div className="stack-xl">
      <SectionHeader eyebrow="Idea Lab" title="Build, validate, and share startup ideas"
        action={
          tab === "mine" && !showForm && !editing
            ? <Button onClick={() => setShowForm(true)}>+ New Idea</Button>
            : null
        }
      />

      <div className="tab-row">
        <button className={`tab ${tab === "mine" ? "tab-active" : ""}`} onClick={() => setTab("mine")} type="button">My Ideas</button>
        <button className={`tab ${tab === "community" ? "tab-active" : ""}`} onClick={() => setTab("community")} type="button">Community Ideas</button>
      </div>

      {tab === "mine" && (
        <>
          {showForm && <IdeaForm onSave={(data) => createMutation.mutate(data)} onCancel={() => setShowForm(false)} isLoading={createMutation.isPending} />}
          {editing && (
            <IdeaForm
              initial={{ ...editing, tags: (editing.tags || []).join(", ") }}
              onSave={(data) => updateMutation.mutate({ id: editing._id, payload: data })}
              onCancel={() => setEditing(null)}
              isLoading={updateMutation.isPending}
            />
          )}
          {loadingMine ? <LoadingState label="Loading your ideas..." /> : (
            myIdeas?.length === 0 ? <EmptyState title="No ideas yet" description="Hit '+ New Idea' to document your first startup concept." /> :
            <div className="course-grid">
              {(myIdeas || []).map((idea) => (
                <Card key={idea._id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span className="pill" style={{ background: STAGE_COLORS[idea.stage], color: "#fff" }}>{idea.stage}</span>
                    <span className="pill muted" style={{ fontSize: "0.72rem" }}>{idea.isPublic ? "Public" : "Private"}</span>
                  </div>
                  <h3 style={{ marginTop: "0.5rem" }}>{idea.title}</h3>
                  <p>{idea.problem?.slice(0, 100)}{idea.problem?.length > 100 ? "..." : ""}</p>
                  <div className="tag-row">
                    {(idea.tags || []).map((t) => <span key={t} className="pill muted">{t}</span>)}
                  </div>
                  <small style={{ color: "var(--text-soft)" }}>Updated {new Date(idea.updatedAt).toLocaleDateString()}</small>
                  <div className="row-actions" style={{ marginTop: "0.75rem" }}>
                    <Button variant="secondary" onClick={() => setEditing(idea)}>Edit</Button>
                    <Button variant="ghost" onClick={() => visibilityMutation.mutate(idea._id)}>
                      {idea.isPublic ? "Make Private" : "Make Public"}
                    </Button>
                    <Button variant="ghost" onClick={() => deleteMutation.mutate(idea._id)} style={{ color: "var(--danger)" }}>Delete</Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "community" && (
        loadingPublic ? <LoadingState label="Loading community ideas..." /> : (
          publicIdeas?.length === 0 ? <EmptyState title="No public ideas yet" description="Be the first to share your startup concept!" /> :
          <div className="course-grid">
            {(publicIdeas || []).map((idea) => (
              <Card key={idea._id}>
                <span className="pill" style={{ background: STAGE_COLORS[idea.stage], color: "#fff" }}>{idea.stage}</span>
                <h3 style={{ marginTop: "0.5rem" }}>{idea.title}</h3>
                <p>{idea.problem}</p>
                <div className="tag-row">{(idea.tags || []).map((t) => <span key={t} className="pill muted">{t}</span>)}</div>
                {idea.user && <small>by {idea.user.name}</small>}
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
}
