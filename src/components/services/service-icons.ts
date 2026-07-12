import {
  Activity,
  Bot,
  Clapperboard,
  Cloud,
  Database,
  FileText,
  Film,
  Folder,
  Globe,
  HardDrive,
  House,
  KeyRound,
  Link2,
  MonitorPlay,
  Network,
  Play,
  Router,
  Server,
  Shield,
  TerminalSquare,
  Upload,
  User,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export const SERVICE_ICONS: Record<string, LucideIcon> = {
  user: User,
  globe: Globe,
  clapperboard: Clapperboard,
  film: Film,
  play: Play,
  "monitor-play": MonitorPlay,
  server: Server,
  network: Network,
  folder: Folder,
  upload: Upload,
  shield: Shield,
  key: KeyRound,
  router: Router,
  database: Database,
  cloud: Cloud,
  wrench: Wrench,
  house: House,
  bot: Bot,
  activity: Activity,
  link: Link2,
  "hard-drive": HardDrive,
  terminal: TerminalSquare,
  "file-text": FileText,
};

export const ICON_CHOICES = Object.keys(SERVICE_ICONS);

export function getServiceIcon(name: string): LucideIcon {
  return SERVICE_ICONS[name] ?? Globe;
}
