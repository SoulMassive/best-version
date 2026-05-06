import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { fetcher } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Card, LoadingState, SectionHeader } from "../../components/ui/UI";

const MEDALS = { 0: "🥇", 1: "🥈", 2: "🥉" };
const MEDAL_COLORS = { 0: "#FFD700", 1: "#C0C0C0", 2: "#CD7F32" };

function AnimatedRank({ rank }) {
  const [displayed, setDisplayed] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    let start = 0;
    const end = rank;
    if (end === 0) return;
    const duration = 800;
    const step = duration / end;
    const timer = setInterval(() => {
      start += 1;
      setDisplayed(start);
      if (start >= end) clearInterval(timer);
    }, Math.min(step, 40));
    return () => clearInterval(timer);
  }, [rank]);

  return <span ref={ref} style={{ fontWeight: 800, fontSize: "1.1rem" }}>#{displayed}</span>;
}

export function LeaderboardPage() {
  const { auth } = useAuth();
  const [metric, setMetric] = useState("points");
  const [timeFilter, setTimeFilter] = useState("all");
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => fetcher("/opportunities/leaderboard"),
  });

  const sorted = [...(data || [])].sort((a, b) => (b[metric] || 0) - (a[metric] || 0));

  const myEntry = sorted.find((e) => e.user?._id === auth.user?._id);
  const myRank = sorted.findIndex((e) => e.user?._id === auth.user?._id) + 1;
  const top50 = sorted.slice(0, 50);
  const isInTop50 = top50.some((e) => e.user?._id === auth.user?._id);

  if (isLoading) return <LoadingState label="Loading leaderboard..." />;

  const metrics = [
    { key: "points", label: "Points" },
    { key: "achievements", label: "Achievements" },
    { key: "competitionWins", label: "Competition Wins" },
    { key: "skillGrowth", label: "Skill Growth" },
    { key: "earnings", label: "Earnings" },
  ];

  return (
    <div className="stack-xl">
      <SectionHeader eyebrow="Leaderboard" title="Who is creating momentum right now?" />

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <div className="tab-row">
          {["all", "weekly", "monthly"].map((t) => (
            <button key={t} className={`tab ${timeFilter === t ? "tab-active" : ""}`} onClick={() => setTimeFilter(t)} type="button">
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t !== "all" && <span className="pill muted" style={{ marginLeft: "0.3rem", fontSize: "0.65rem" }}>Soon</span>}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <div className="tab-row" style={{ marginBottom: "1rem" }}>
          {metrics.map(({ key, label }) => (
            <button className={`tab ${metric === key ? "tab-active" : ""}`} key={key} onClick={() => setMetric(key)} type="button">
              {label}
            </button>
          ))}
        </div>

        <div className="stack">
          {top50.map((entry, index) => {
            const isMe = entry.user?._id === auth.user?._id;
            const isMedal = index < 3;
            return (
              <div
                key={entry._id}
                className={`leaderboard-row ${isMe ? "leaderboard-row-active" : ""}`}
                style={isMedal ? { background: `${MEDAL_COLORS[index]}18`, borderColor: `${MEDAL_COLORS[index]}44` } : {}}
              >
                <div style={{ minWidth: "2.5rem", textAlign: "center" }}>
                  {isMedal ? (
                    <span style={{ fontSize: "1.4rem" }}>{MEDALS[index]}</span>
                  ) : (
                    <AnimatedRank rank={index + 1} />
                  )}
                </div>
                <img
                  src={entry.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${entry.user?.name}`}
                  alt={entry.user?.name}
                  style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
                />
                <div style={{ flex: 1 }}>
                  <strong>{entry.user?.name}{isMe ? " (You)" : ""}</strong>
                  <p style={{ fontSize: "0.82rem" }}>{entry.user?.headline}</p>
                </div>
                <strong style={{ fontSize: "1.1rem", color: "var(--brand-dark)" }}>
                  {metric === "earnings" ? `$${entry[metric] || 0}` : entry[metric] || 0}
                </strong>
              </div>
            );
          })}

          {!isInTop50 && myEntry && (
            <>
              <div style={{ textAlign: "center", color: "var(--text-soft)", padding: "0.5rem" }}>• • •</div>
              <div className="leaderboard-row leaderboard-row-active">
                <AnimatedRank rank={myRank} />
                <img
                  src={myEntry.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${myEntry.user?.name}`}
                  alt={myEntry.user?.name}
                  style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
                />
                <div style={{ flex: 1 }}>
                  <strong>{myEntry.user?.name} (You)</strong>
                  <p style={{ fontSize: "0.82rem" }}>{myEntry.user?.headline}</p>
                </div>
                <strong>{myEntry[metric] || 0}</strong>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
