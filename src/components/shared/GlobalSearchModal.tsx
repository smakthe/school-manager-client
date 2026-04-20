import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Building2,
  GraduationCap,
  Users,
  User,
  Loader2,
} from "lucide-react";
import { Command } from "cmdk";
import { apiFetch } from "../../api/client";

interface SearchResult {
  id: string;
  type: "school" | "classroom" | "teacher" | "principal" | "student";
  attributes: any;
}

// Ensure you wrap the children of this component globally
export function GlobalSearchModal() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const navigate = useNavigate();

  // Toggle open state on Cmd+K
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Expose an event to window to open it from Navbar
  React.useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener("open-global-search", handleOpen);
    return () => window.removeEventListener("open-global-search", handleOpen);
  }, []);

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  React.useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await apiFetch<{ data: SearchResult[] }>(
          `/search?q=${encodeURIComponent(query)}`,
        );
        setResults(response.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (item: SearchResult) => {
    setOpen(false);
    const type = item.type;
    // Routing based exactly on what user said:
    // "Schools/Classrooms are clickable and clicking on them they will open in their correct nested UI directory"
    // "Principals/Teachers/Students are not clickable. They will appear on the search results with their corresponding details"

    // We only route for school and classroom.
    if (type === "school") {
      // For Admin
      navigate("/admin/explore", { state: { targetSchoolId: item.id } });
    } else if (type === "classroom") {
      // Determine what path based on role? The user might be Admin or Principal.
      // The easiest way is relative to current base path.
      // E.g. we might dispatch a custom event or check role from store
      const pathBase = window.location.pathname.startsWith("/principal")
        ? "/principal"
        : "/admin";
      navigate(`${pathBase}/explore`, {
        state: {
          targetSchoolId:
            item.attributes.school_id || item.attributes.school?.id,
          targetClassroomId: item.id,
        },
      });
    }
  };

  if (!open) return null;

  const schools = results.filter((r) => r.type === "school");
  const classrooms = results.filter((r) => r.type === "classroom");
  const teachers = results.filter(
    (r) => r.type === "teacher" || r.type === "principal",
  ); // we set it to teacher or principal in type map if we mapped it, wait, standard jsonapi output uses `type` mapping.
  const students = results.filter((r) => r.type === "student");

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] pb-[5vh] bg-background/80 backdrop-blur-sm sm:pt-[20vh]">
      <div className="fixed inset-0 -z-10" onClick={() => setOpen(false)} />
      <Command
        className="w-full max-w-2xl overflow-hidden rounded-xl border bg-card text-card-foreground shadow-2xl flex flex-col"
        shouldFilter={false} // We handle filtering via backend ES
      >
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-5 w-5 shrink-0 opacity-50 text-foreground" />
          <Command.Input
            value={query}
            onValueChange={setQuery}
            autoFocus
            className="flex h-14 w-full rounded-md bg-transparent py-3 text-lg outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Search across all resources..."
          />
          {loading && (
            <Loader2 className="ml-2 h-5 w-5 animate-spin opacity-50" />
          )}
        </div>

        <Command.List className="max-h-[60vh] overflow-y-auto p-2">
          {!loading && results.length === 0 && query.length > 0 && (
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found for "{query}".
            </Command.Empty>
          )}

          {schools.length > 0 && (
            <Command.Group
              heading="Schools"
              className="text-xs font-semibold text-muted-foreground px-2 py-1.5 [&_[cmdk-group-heading]]:mb-2"
            >
              {schools.map((s) => (
                <Command.Item
                  key={s.id}
                  value={`school-${s.id}`}
                  onSelect={() => handleSelect(s)}
                  className="flex items-center rounded-md px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground transition-colors mb-1"
                >
                  <Building2 className="mr-3 h-4 w-4 text-primary shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground">
                      {s.attributes.name}
                    </span>
                    <span className="text-xs text-muted-foreground opacity-80">
                      {s.attributes.board} • {s.attributes.city}
                    </span>
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {classrooms.length > 0 && (
            <Command.Group
              heading="Classrooms"
              className="text-xs font-semibold text-muted-foreground px-2 py-1.5 mt-2 border-t [&_[cmdk-group-heading]]:mb-2 [&_[cmdk-group-heading]]:pt-2"
            >
              {classrooms.map((c) => (
                <Command.Item
                  key={c.id}
                  value={`class-${c.id}`}
                  onSelect={() => handleSelect(c)}
                  className="flex items-center rounded-md px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground transition-colors mb-1"
                >
                  <GraduationCap className="mr-3 h-4 w-4 text-primary shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground">
                      Class {c.attributes.display_name}
                    </span>
                    <span className="text-xs text-muted-foreground opacity-80">
                      {c.attributes.school_name}
                    </span>
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {teachers.length > 0 && (
            <Command.Group
              heading="Teachers & Staff"
              className="text-xs font-semibold text-muted-foreground px-2 py-1.5 mt-2 border-t [&_[cmdk-group-heading]]:mb-2 [&_[cmdk-group-heading]]:pt-2"
            >
              {teachers.map((t) => (
                <Command.Item
                  key={t.id}
                  value={`teacher-${t.id}`}
                  onSelect={() => {}} // User explicitly requested no click/routing for these
                  className="flex items-center rounded-md px-3 py-2 text-sm cursor-default hover:bg-accent/50 aria-selected:bg-accent/50 transition-colors mb-1"
                >
                  <Users className="mr-3 h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex flex-col w-full">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">
                        {t.attributes.name}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-muted/50 border border-border/50 text-muted-foreground">
                        {t.attributes.type || "Staff"}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground opacity-80">
                      {t.attributes.school?.name || t.attributes.school_name} •{" "}
                      {t.attributes.employee_code}
                    </span>
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {students.length > 0 && (
            <Command.Group
              heading="Students"
              className="text-xs font-semibold text-muted-foreground px-2 py-1.5 mt-2 border-t [&_[cmdk-group-heading]]:mb-2 [&_[cmdk-group-heading]]:pt-2"
            >
              {students.map((st) => (
                <Command.Item
                  key={st.id}
                  value={`student-${st.id}`}
                  onSelect={() => {}} // User explicitly requested no click/routing for these
                  className="flex items-center rounded-md px-3 py-2 text-sm cursor-default hover:bg-accent/50 aria-selected:bg-accent/50 transition-colors mb-1"
                >
                  <User className="mr-3 h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground">
                      {st.attributes.name}
                    </span>
                    <span className="text-xs text-muted-foreground opacity-80">
                      Class {st.attributes.classroom_name} •{" "}
                      {st.attributes.school_name} • Adm:{" "}
                      {st.attributes.admission_number}
                    </span>
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          )}
        </Command.List>
        <div className="border-t py-2 text-center text-xs text-muted-foreground opacity-60">
          Powered by Elasticsearch Semantic Engine
        </div>
      </Command>
    </div>
  );
}
