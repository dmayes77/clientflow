/**
 * App UI Components (Dashboard & Admin)
 *
 * Compact, software-style components for the app interface.
 * These are separate from the marketing /components/ui/ components
 * to allow for different styling between the app and marketing site.
 *
 * Usage:
 * import { Button, Input, Card } from "@/app/(auth)/components/ui";
 *
 * Or import individual components:
 * import { Button } from "@/app/(auth)/components/ui/button";
 */

// Form Components
export { Button, buttonVariants } from "./button";
export { Input } from "./input";
export { Textarea } from "./textarea";
export { Label } from "./label";
export { Checkbox } from "./checkbox";
export { Switch } from "./switch";
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from "./select";

// Layout Components
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "./card";
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "./table";
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";

// Feedback Components
export { Badge, badgeVariants } from "./badge";
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./tooltip";

// Overlay Components
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./dialog";
export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "./alert-dialog";
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from "./dropdown-menu";
export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor } from "./popover";
export { ScrollArea, ScrollBar } from "./scroll-area";
export { Separator } from "./separator";
export { Collapsible, CollapsibleTrigger, CollapsibleContent } from "./collapsible";
export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "./command";
export { Alert, AlertTitle, AlertDescription } from "./alert";
export { DurationSelect, DurationDisplay } from "./duration-select";
