import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { api, fetcher } from "../../api/client";
import { Button, Card, EmptyState, Field, LoadingState, SectionHeader } from "../../components/ui/UI";
import { useAuth } from "../../context/AuthContext";

const POST_TYPES = ["update", "project", "certificate", "thought"];

function PostComposer({ onPost }) {
  const [content, setContent] = useState("");
  const [type, setType] = useState("update");
  const mutation = useMutation({
    mutationFn: () => api.post("/community/posts", { content, type }),
    onSuccess: () => { toast.success("Posted!"); setContent(""); onPost(); },
    onError: (err) => toast.error(err?.response?.data?.message || "Could not post"),
  });
  return (
    <Card>
      <Field label="Share something with the network" value={content} onChange={(e) => setContent(e.target.value)} textarea placeholder="What are you working on? A win, a lesson, a project..." />
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
        <select value={type} onChange={(e) => setType(e.target.value)} style={{ padding: "0.4rem 0.8rem", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface)" }}>
          {POST_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
        <Button onClick={() => mutation.mutate()} disabled={!content.trim() || mutation.isPending} style={{ marginLeft: "auto" }}>
          {mutation.isPending ? "Posting..." : "Post"}
        </Button>
      </div>
    </Card>
  );
}

function FeedCard({ post, currentUserId }) {
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const likeMutation = useMutation({
    mutationFn: () => api.post(`/community/posts/${post._id}/like`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["community"] }),
  });

  const commentMutation = useMutation({
    mutationFn: () => api.post(`/community/posts/${post._id}/comment`, { content: commentText }),
    onSuccess: () => { setCommentText(""); queryClient.invalidateQueries({ queryKey: ["community"] }); },
    onError: (err) => toast.error(err?.response?.data?.message || "Could not comment"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/community/posts/${post._id}`),
    onSuccess: () => { toast.success("Post deleted"); queryClient.invalidateQueries({ queryKey: ["community"] }); },
  });

  const typeColors = { update: "var(--brand)", project: "var(--accent)", certificate: "#22c55e", thought: "var(--text-soft)" };

  return (
    <div style={{ background: "var(--surface)", borderRadius: "var(--radius-md)", padding: "1rem 1.2rem", border: "1px solid rgba(255,255,255,0.7)", boxShadow: "0 4px 16px rgba(19,33,23,0.06)" }}>
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
        <img src={post.author?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${post.author?.name}`} alt={post.author?.name} style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong>{post.author?.name}</strong>
              <span className="pill muted" style={{ marginLeft: "0.4rem", background: typeColors[post.type] || "var(--text-soft)", color: "#fff", fontSize: "0.68rem" }}>{post.type}</span>
            </div>
            {post.author?._id === currentUserId && (
              <button onClick={() => deleteMutation.mutate()} style={{ border: 0, background: "transparent", color: "var(--danger)", cursor: "pointer", fontSize: "0.8rem" }}>Delete</button>
            )}
          </div>
          <p style={{ marginTop: "0.4rem" }}>{post.content}</p>
          <div style={{ display: "flex", gap: "1rem", marginTop: "0.6rem" }}>
            <button
              onClick={() => likeMutation.mutate()}
              style={{ border: 0, background: "transparent", cursor: "pointer", color: post.hasLiked ? "var(--brand)" : "var(--text-soft)", fontWeight: 700, fontSize: "0.85rem" }}
            >
              {post.hasLiked ? "♥" : "♡"} {post.likeCount || 0}
            </button>
            <button
              onClick={() => setShowComments(!showComments)}
              style={{ border: 0, background: "transparent", cursor: "pointer", color: "var(--text-soft)", fontSize: "0.85rem" }}
            >
              💬 {post.commentCount || 0} comment{post.commentCount !== 1 ? "s" : ""}
            </button>
          </div>
          {showComments && (
            <div style={{ marginTop: "0.75rem" }}>
              {(post.comments || []).map((c, i) => (
                <div key={c._id || i} style={{ fontSize: "0.85rem", padding: "0.4rem 0", borderTop: "1px solid var(--line)" }}>
                  <strong>{c.user?.name || "User"}: </strong>{c.content}
                </div>
              ))}
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  style={{ flex: 1, padding: "0.4rem 0.8rem", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface)", fontSize: "0.85rem" }}
                  onKeyDown={(e) => e.key === "Enter" && commentText.trim() && commentMutation.mutate()}
                />
                <Button variant="secondary" onClick={() => commentMutation.mutate()} disabled={!commentText.trim()}>Post</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CommunityPage() {
  const { auth } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["community", page],
    queryFn: () => fetcher(`/community?page=${page}`),
  });

  const followMutation = useMutation({
    mutationFn: ({ userId, isFollowing }) =>
      isFollowing ? api.delete(`/community/follow/${userId}`) : api.post(`/community/follow/${userId}`),
    onSuccess: (_, { isFollowing }) => {
      toast.success(isFollowing ? "Unfollowed" : "Connection updated");
      queryClient.invalidateQueries({ queryKey: ["community"] });
    },
    onError: () => toast.error("Could not update connection right now."),
  });

  if (isLoading) return <LoadingState label="Loading community..." />;

  return (
    <div className="grid-two">
      {/* Left: People + Prompts */}
      <div className="stack">
        <Card>
          <SectionHeader eyebrow="Discover people" title="Collaborators, peers, and inspiring builders" />
          <div className="stack">
            {data.people.map((person) => (
              <div className="person-row" key={person._id}>
                <img src={person.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${person.name}`} alt={person.name} />
                <div>
                  <strong>{person.name}</strong>
                  <p>{person.headline}</p>
                </div>
                <Button
                  variant={person.isFollowing ? "secondary" : "primary"}
                  disabled={followMutation.isPending && followMutation.variables?.userId === person._id}
                  onClick={() => followMutation.mutate({ userId: person._id, isFollowing: person.isFollowing })}
                >
                  {followMutation.isPending && followMutation.variables?.userId === person._id
                    ? "..." : person.isFollowing ? "Unfollow" : "Follow"}
                </Button>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <SectionHeader eyebrow="Prompts" title="Ideas to spark collaboration" />
          <div className="stack">
            {data.prompts.map((prompt) => <p key={prompt}>{prompt}</p>)}
          </div>
        </Card>
      </div>

      {/* Right: Feed */}
      <div className="stack">
        <PostComposer onPost={() => queryClient.invalidateQueries({ queryKey: ["community"] })} />
        <SectionHeader eyebrow="Activity feed" title="What the network is shipping" />
        {data.feed.length === 0 ? (
          <EmptyState title="No posts yet" description="Be the first to share something with the community!" />
        ) : (
          data.feed.map((post) => <FeedCard key={post._id} post={post} currentUserId={auth.user?._id} />)
        )}
        {data.pagination?.hasMore && (
          <Button variant="secondary" onClick={() => setPage(page + 1)} style={{ alignSelf: "center" }}>Load More</Button>
        )}
      </div>
    </div>
  );
}
