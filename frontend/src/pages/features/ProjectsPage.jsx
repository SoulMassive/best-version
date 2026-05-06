import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { api, fetcher } from "../../api/client";
import { Button, Card, EmptyState, Field, LoadingState, ProgressBar, SectionHeader } from "../../components/ui/UI";

const emptyProject = {
  title: "",
  brief: "",
  description: "",
  category: "Product",
  status: "planning",
  completion: 20,
};

const statusColors = {
  planning: "var(--text-soft)",
  building: "var(--brand)",
  submitted: "var(--accent)",
  completed: "#22c55e",
};

export function ProjectsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => fetcher("/projects"),
  });
  const [form, setForm] = useState(emptyProject);
  const [editingId, setEditingId] = useState(null);

  const createMutation = useMutation({
    mutationFn: (payload) => api.post("/projects", payload),
    onSuccess: () => {
      toast.success("Project saved");
      setForm(emptyProject);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to save project"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => api.patch(`/projects/${id}`, payload),
    onSuccess: () => {
      toast.success("Project updated");
      setEditingId(null);
      setForm(emptyProject);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const submitMutation = useMutation({
    mutationFn: ({ id, payload }) => api.post(`/projects/${id}/submit`, payload),
    onSuccess: () => {
      toast.success("Project submitted");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  if (isLoading) return <LoadingState label="Loading project workspace..." />;

  function handleSubmit(event) {
    event.preventDefault();
    if (editingId) updateMutation.mutate({ id: editingId, payload: form });
    else createMutation.mutate({ ...form, milestones: [{ title: "Kickoff", status: "active", dueDate: new Date() }] });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm(emptyProject);
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "2rem", alignItems: "start" }}>
      {/* LEFT COLUMN: FORM */}
      <Card style={{ position: "sticky", top: "5.5rem" }}>
        <SectionHeader eyebrow="Build studio" title={editingId ? "Edit project" : "Create a new project"} />
        <form className="stack" onSubmit={handleSubmit}>
          <Field label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Campus Creator Hub" />
          <Field label="Brief" value={form.brief} onChange={(e) => setForm({ ...form, brief: e.target.value })} textarea placeholder="1-2 sentences explaining the core value proposition." />
          <Field
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            textarea
            placeholder="Detailed features, tech stack, and goals..."
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <label className="field">
              <span>Category</span>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option>Product</option>
                <option>SaaS</option>
                <option>Career</option>
                <option>Community</option>
              </select>
            </label>
            <label className="field">
              <span>Status</span>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="planning">Planning</option>
                <option value="building">Building</option>
                <option value="submitted">Submitted</option>
                <option value="completed">Completed</option>
              </select>
            </label>
          </div>
          
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
            {editingId && (
              <Button variant="ghost" type="button" onClick={handleCancelEdit} style={{ flex: 1 }}>
                Cancel
              </Button>
            )}
            <Button type="submit" style={{ flex: editingId ? 1 : "1 1 auto", width: editingId ? "auto" : "100%" }} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingId ? "Save changes" : "Create project"}
            </Button>
          </div>
        </form>
      </Card>

      {/* RIGHT COLUMN: LIST */}
      <div className="stack-xl">
        <SectionHeader eyebrow="Your projects" title="Track milestones and submit work" />
        {data.length ? (
          <div style={{ display: "grid", gap: "1.25rem", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
            {data.map((project) => (
              <Card key={project._id} style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                  <div>
                    <h3 style={{ fontSize: "1.15rem", marginBottom: "0.25rem" }}>{project.title}</h3>
                    <p style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>{project.brief}</p>
                  </div>
                  <span className="pill" style={{ 
                    flexShrink: 0, 
                    background: statusColors[project.status] || "var(--brand)", 
                    color: project.status === "planning" ? "#fff" : (project.status === "building" ? "#fff" : "#111"),
                    fontSize: "0.7rem",
                    padding: "0.3rem 0.6rem"
                  }}>
                    {project.status}
                  </span>
                </div>
                
                <div style={{ marginTop: "1.5rem", marginBottom: "0.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", fontSize: "0.8rem", fontWeight: 700, color: "var(--brand-dark)" }}>
                    <span>Progress</span>
                    <span>{project.completion}%</span>
                  </div>
                  <ProgressBar value={project.completion} />
                </div>

                <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto", paddingTop: "1.25rem" }}>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditingId(project._id);
                      setForm({
                        title: project.title,
                        brief: project.brief,
                        description: project.description,
                        category: project.category,
                        status: project.status,
                      });
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant={project.status === "submitted" || project.status === "completed" ? "ghost" : "primary"}
                    style={{ marginLeft: "auto" }} 
                    disabled={project.status === "submitted" || project.status === "completed" || submitMutation.isPending}
                    onClick={() => submitMutation.mutate({ id: project._id, payload: { notes: "Submitting MVP", submissionUrl: project.liveUrl || "" } })}
                  >
                    {project.status === "submitted" ? "Submitted ✓" : "Submit work"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState title="No projects yet" description="Create your first portfolio-ready build to start compounding proof." />
        )}
      </div>
    </div>
  );
}
