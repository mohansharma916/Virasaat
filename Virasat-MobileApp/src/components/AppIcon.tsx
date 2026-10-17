import {
  BadgeCheck,
  Bell,
  Calendar,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  Clock,
  Contact,
  Eye,
  EyeOff,
  FileText,
  FingerprintPattern,
  Folder,
  Gem,
  Heart,
  Hourglass,
  House,
  Image as ImageIcon,
  Info,
  KeyRound,
  Landmark,
  Lightbulb,
  Lock,
  LogOut,
  Mail,
  MailCheck,
  MessageSquareText,
  PenLine,
  Phone,
  Play,
  Plus,
  ScanFace,
  ScanLine,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  TrendingUp,
  TriangleAlert,
  Upload,
  User,
  UserCheck,
  UserPlus,
  Users,
  Video,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';

import { colors } from '@/src/theme/colors';

const ICONS = {
  alert: CircleAlert,
  bell: Bell,
  calendar: Calendar,
  camera: Camera,
  check: Check,
  checkCircle: CircleCheck,
  chevronDown: ChevronDown,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  clock: Clock,
  close: X,
  contact: Contact,
  document: FileText,
  eye: Eye,
  eyeOff: EyeOff,
  face: ScanFace,
  fingerprint: FingerprintPattern,
  folder: Folder,
  gem: Gem,
  heart: Heart,
  help: CircleHelp,
  home: House,
  hourglass: Hourglass,
  image: ImageIcon,
  info: Info,
  investment: TrendingUp,
  bank: Landmark,
  key: KeyRound,
  idea: Lightbulb,
  lock: Lock,
  logOut: LogOut,
  mail: Mail,
  mailCheck: MailCheck,
  message: MessageSquareText,
  pen: PenLine,
  phone: Phone,
  play: Play,
  plus: Plus,
  scan: ScanLine,
  search: Search,
  settings: Settings,
  shield: Shield,
  shieldCheck: ShieldCheck,
  smartphone: Smartphone,
  sparkles: Sparkles,
  trash: Trash2,
  upload: Upload,
  user: User,
  userCheck: UserCheck,
  userPlus: UserPlus,
  users: Users,
  verified: BadgeCheck,
  video: Video,
  warning: TriangleAlert,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

type AppIconProps = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  // Lets an icon replace a text glyph in place: size and colour are read from
  // the glyph's text style unless given explicitly.
  style?: StyleProp<TextStyle>;
  // Icons are decorative by default; pass a label only for icon-only meaning.
  accessibilityLabel?: string;
};

export function AppIcon({
  name,
  size,
  color,
  strokeWidth = 1.75,
  style,
  accessibilityLabel,
}: AppIconProps) {
  const Icon = ICONS[name];
  const flat = StyleSheet.flatten(style) ?? {};
  const resolvedSize = size ?? Math.max(16, Math.round((flat.fontSize ?? 20) * 1.1));
  const resolvedColor = color ?? (typeof flat.color === 'string' ? flat.color : colors.primary.forest);

  return (
    <Icon
      size={resolvedSize}
      color={resolvedColor}
      strokeWidth={strokeWidth}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      importantForAccessibility={accessibilityLabel ? 'yes' : 'no-hide-descendants'}
    />
  );
}
