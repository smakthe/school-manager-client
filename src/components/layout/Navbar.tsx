import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { useThemeStore } from "../../stores/themeStore";
import { useTeacherStore } from "../../stores/teacherStore";
import {
  Moon,
  Sun,
  GraduationCap,
  LogOut,
  User as UserIcon,
  Search,
} from "lucide-react";
import { Button } from "../ui/button";
import { GlobalSearchModal } from "../shared/GlobalSearchModal";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "../ui/dropdown-menu";

export function Navbar() {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { homeroom } = useTeacherStore();
  const location = useLocation();

  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const placeholders = [
    "Search \"Daughtry Principal\"",
    "Search \"Tanisha Khan Bosco\"",
    "Search \"Future Scholars IX C\"",
    "Search \"VI-B class teacher\""
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [placeholders.length]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const isAdmin     = user?.role === "admin";
  const isPrincipal = user?.role === "principal";

  const homeBase = isAdmin ? "/admin" : isPrincipal ? "/principal" : "/teacher";

  const navLinks = isAdmin
    ? [
        { name: "Dashboard", path: "/admin" },
        { name: "Explore",   path: "/admin/explore" },
      ]
    : isPrincipal
    ? [
        { name: "Dashboard", path: "/principal" },
        { name: "Explore",   path: "/principal/explore" },
      ]
    : [
        { name: "Dashboard", path: "/teacher" },
        // Only show My Classroom if this teacher is confirmed as a class teacher
        ...(homeroom ? [{ name: "My Classroom", path: "/teacher/explore" }] : []),
      ];

  const displayName = user?.name || (isAdmin ? "Admin User" : isPrincipal ? "Principal" : "Teacher");

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link to={homeBase} className="flex items-center gap-2 font-bold text-lg text-primary">
            <GraduationCap className="h-6 w-6" />
            <span>School Manager</span>
          </Link>

          <nav className="hidden md:flex gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === link.path ||
                  (link.path !== "/admin" &&
                    location.pathname.startsWith(link.path))
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Global Search Trigger */}
        <div className="flex-1 flex justify-end md:justify-center mx-4 md:mx-8">
          <Button
            variant="outline"
            className="w-full md:max-w-sm justify-start text-sm text-muted-foreground shadow-none bg-muted/30 border-muted-foreground/20 hover:bg-muted/50 rounded-full h-9 px-4 transition-all"
            onClick={() => window.dispatchEvent(new Event("open-global-search"))}
          >
            <Search className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">{placeholders[placeholderIndex]}</span>
            <span className="ml-auto flex shrink-0 items-center gap-1 leading-none text-xs hidden md:flex border bg-muted/60 px-1.5 py-0.5 rounded-sm opacity-70">
              <span className="text-[10px]">⌘</span>K
            </span>
          </Button>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                />
              }
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user?.email?.[0].toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {displayName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                render={
                  <Link
                    to="/admin/profile"
                    className="cursor-pointer flex w-full items-center"
                  />
                }
              >
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <GlobalSearchModal />
    </header>
  );
}
