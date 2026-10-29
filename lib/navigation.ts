import {
  Bell, BriefcaseBusiness, CalendarDays, FolderKanban, House, MessageCircle,
  Network, Search, Settings, Sparkles, Users
} from "lucide-react";

export const navigation = [
  { href: "/home", label: "Home", icon: House },
  { href: "/explore", label: "Explore", icon: Sparkles },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/students", label: "Students", icon: Users },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/opportunities", label: "Opportunities", icon: BriefcaseBusiness },
  { href: "/clubs", label: "Clubs & events", icon: CalendarDays },
  { href: "/my-network", label: "My network", icon: Network }
];

export const utilityNavigation = [
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/search", label: "Search", icon: Search },
  { href: "/settings", label: "Settings", icon: Settings }
];
