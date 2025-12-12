/**
 * Centralized icon exports for consistent usage throughout the app.
 * Import from here instead of lucide-react directly for semantic icons.
 */
import {
  CalendarPlus,
  FilePlus2,
  UserPlus,
  Plus,
  Pencil,
  Trash2,
  Save,
  ArrowLeft,
  Loader2,
  Phone,
  Mail,
  Tag,
  Package,
  Receipt,
  FileText,
  Send,
  Download,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  MoreHorizontal,
  ChevronRight,
  Calendar,
  DollarSign,
  User,
  Building,
  Globe,
  MessageSquare,
  Check,
  ExternalLink,
  MinusCircle,
} from "lucide-react";

// Action icons - semantic naming for common actions
export const NewBookingIcon = CalendarPlus;
export const NewInvoiceIcon = FilePlus2;
export const NewContactIcon = UserPlus;
export const AddIcon = Plus;
export const EditIcon = Pencil;
export const DeleteIcon = Trash2;
export const SaveIcon = Save;
export const BackIcon = ArrowLeft;
export const LoadingIcon = Loader2;
export const CloseIcon = X;
export const MoreIcon = MoreHorizontal;
export const NextIcon = ChevronRight;
export const LinkIcon = ExternalLink;
export const RemoveIcon = MinusCircle;

// Contact icons
export const PhoneIcon = Phone;
export const EmailIcon = Mail;
export const PersonIcon = User;
export const CompanyIcon = Building;
export const WebsiteIcon = Globe;
export const NotesIcon = MessageSquare;

// Entity icons
export const TagIcon = Tag;
export const PackageIcon = Package;
export const ServiceIcon = Receipt;
export const InvoiceIcon = FileText;
export const BookingIcon = Calendar;
export const MoneyIcon = DollarSign;

// Status icons
export const SendIcon = Send;
export const DownloadIcon = Download;
export const ViewIcon = Eye;
export const CompleteIcon = CheckCircle;
export const PendingIcon = Clock;
export const WarningIcon = AlertCircle;
export const SuccessIcon = Check;

// Re-export all for cases where direct lucide icons are needed
export {
  CalendarPlus,
  FilePlus2,
  UserPlus,
  Plus,
  Pencil,
  Trash2,
  Save,
  ArrowLeft,
  Loader2,
  Phone,
  Mail,
  Tag,
  Package,
  Receipt,
  FileText,
  Send,
  Download,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  MoreHorizontal,
  ChevronRight,
  Calendar,
  DollarSign,
  User,
  Building,
  Globe,
  MessageSquare,
  Check,
  ExternalLink,
  MinusCircle,
};
