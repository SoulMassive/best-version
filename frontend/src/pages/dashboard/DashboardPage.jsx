import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetcher } from "../../api/client";
import { ShareButtons } from "../../components/ui/ShareButtons";
import { Button, Card, LoadingState, ProgressBar, SectionHeader, Stat } from "../../components/ui/UI";

export function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => fetcher("/dashboard"),
    retry: 1,
  });

  if (isLoading) return <LoadingState label="Loading dashboard..." />;

  if (isError || !data) {
    return (
      <div className="stack-xl">
        <Card>
          <SectionHeader eyebrow="Dashboard" title="Could not load dashboard" description="There was a problem connecting to the server. Please make sure the backend is running and try refreshing the page." />
          <Button onClick={() => window.location.reload()}>Reload</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="stack-xl">
      <section className="hero-banner">
        <div>
          <span className="eyebrow">Welcome back</span>
          <h2>{data.welcome.name}, your next proof point is one action away.</h2>
          <p>{data.welcome.headline}</p>
        </div>
        <Link to="/assessment">
          <Button variant="secondary">Refresh my path</Button>
        </Link>
      </section>

      <section className="stats-grid">
        <Stat label="XP" value={data.progressOverview?.xp ?? 0} helper="Keep compounding progress" />
        <Stat label="Streak" value={`${data.progressOverview?.streak ?? 0} days`} helper="Momentum matters" />
        <Stat label="Courses" value={data.progressOverview?.completedCourses ?? 0} helper="Completed courses" />
        <Stat label="Projects" value={data.progressOverview?.projectsBuilt ?? 0} helper="Portfolio-ready work" />
      </section>

      <section className="grid-two">
        <Card>
          <SectionHeader eyebrow="Recommendations" title="Best next moves" />
          <div className="stack">
            {(data.recommendations || []).map((item) => (
              <div className="list-row" key={item.title}>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.subtitle}</p>
                </div>
                <Link to={item.actionPath}>
                  <Button variant="ghost">Open</Button>
                </Link>
              </div>
            ))}
          </div>
          <ShareButtons label="Share your progress" text="I'm building my best version. Check out my progress!" />
        </Card>

        <Card>
          <SectionHeader eyebrow="Wallet" title="Earnings pulse" />
          <div className="stats-grid compact">
            <Stat label="Balance" value={`$${data.wallet?.balance || 0}`} />
            <Stat label="Pending" value={`$${data.wallet?.pending || 0}`} />
          </div>
          <div className="stack">
            {(data.wallet?.transactions || []).map((item) => (
              <div className="list-row" key={`${item.label}-${item.amount}`}>
                <div>
                  <strong>{item.label}</strong>
                  <p>{new Date(item.occurredAt).toLocaleDateString()}</p>
                </div>
                <strong>{item.type === "credit" ? "+" : "-"}${item.amount}</strong>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid-two">
        <Card>
          <SectionHeader eyebrow="Learning" title="Active courses" action={<Link to="/courses">See all</Link>} />
          <div className="stack">
            {(data.activeCourses || []).map((item) => (
              <div className="course-row" key={item._id}>
                <div>
                  <strong>{item.course.title}</strong>
                  <p>{item.course.category}</p>
                </div>
                <div className="progress-wrap">
                  <ProgressBar value={item.progress} />
                  <span>{item.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader eyebrow="Projects" title="Build tracker" action={<Link to="/projects">Open studio</Link>} />
          <div className="stack">
            {(data.activeProjects || []).map((item) => (
              <div className="list-row" key={item._id}>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.brief}</p>
                </div>
                <span className="pill">{item.status}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid-three">
        <Card>
          <SectionHeader eyebrow="Competitions" title="Live and upcoming" />
          <div className="stack">
            {(data.competitions || []).map((item) => (
              <div key={item._id}>
                <strong>{item.title}</strong>
                <p>
                  {item.prize} • {item.status}
                </p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <SectionHeader eyebrow="Mentors" title="Good matches" />
          <div className="stack">
            {(data.mentors || []).map((item) => (
              <div className="person-row" key={item._id}>
                <img src={item.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${item.user?.name}`} alt={item.user?.name} />
                <div>
                  <strong>{item.user?.name}</strong>
                  <p>{item.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <SectionHeader eyebrow="Notifications" title="Recent updates" />
          <div className="stack">
            {(data.notifications || []).map((item) => (
              <div key={item._id}>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
