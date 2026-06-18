# Graph Report - .  (2026-06-17)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 795 nodes · 776 edges · 114 communities (84 shown, 30 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 87 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 94|Community 94]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 96|Community 96]]
- [[_COMMUNITY_Community 97|Community 97]]
- [[_COMMUNITY_Community 98|Community 98]]
- [[_COMMUNITY_Community 99|Community 99]]
- [[_COMMUNITY_Community 100|Community 100]]
- [[_COMMUNITY_Community 102|Community 102]]
- [[_COMMUNITY_Community 103|Community 103]]
- [[_COMMUNITY_Community 104|Community 104]]
- [[_COMMUNITY_Community 107|Community 107]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 32 edges
2. `useAuth()` - 26 edges
3. `useToast()` - 23 edges
4. `compilerOptions` - 14 edges
5. `API Design Summary` - 14 edges
6. `scripts` - 10 edges
7. `Application Architecture` - 9 edges
8. `V-TEKI Institute Platform` - 8 edges
9. `Operational Policies` - 8 edges
10. `Project Progress` - 7 edges

## Surprising Connections (you probably didn't know these)
- `AuthenticatedApp()` --calls--> `useAuth()`  [INFERRED]
  src/App.jsx → src/lib/AuthContext.jsx
- `ProtectedRoute()` --calls--> `useAuth()`  [INFERRED]
  src/components/ProtectedRoute.jsx → src/lib/AuthContext.jsx
- `DashboardLayout()` --calls--> `useAuth()`  [INFERRED]
  src/components/layout/DashboardLayout.jsx → src/lib/AuthContext.jsx
- `Navbar()` --calls--> `useAuth()`  [INFERRED]
  src/components/public/Navbar.jsx → src/lib/AuthContext.jsx
- `AlertDialogHeader()` --calls--> `cn()`  [INFERRED]
  src/components/ui/alert-dialog.jsx → src/lib/utils.js

## Import Cycles
- None detected.

## Communities (114 total, 30 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (67): dependencies, canvas-confetti, class-variance-authority, clsx, cmdk, date-fns, dotenv, embla-carousel-react (+59 more)

### Community 1 - "Community 1"
Cohesion: 0.04
Nodes (26): AdminAssessments(), emptyAssessment, AdminAttendance(), AdminBatches(), emptyBatch, AdminCertificates(), AdminFeedback(), AdminPayments() (+18 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (19): appClient, auth, clone(), defaultDatabase, entities, findLocalUserByCredentials(), getCacheItem(), getCacheKey() (+11 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (33): devDependencies, autoprefixer, baseline-browser-mapping, eslint, @eslint/js, eslint-plugin-react, eslint-plugin-react-hooks, eslint-plugin-react-refresh (+25 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (25): Sidebar, SidebarContent, SidebarContext, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel (+17 more)

### Community 5 - "Community 5"
Cohesion: 0.18
Nodes (17): {
  buildEntityRegistry,
  inferTypeFromValue,
  inferFieldType,
  isForeignKeyField,
}, {
  ENTITY_MAPPING,
  getSupabaseTableName,
  getEntityMapping,
  getLocalEntityName,
  getAllEntitiesSortedByPriority,
}, buildEntityRegistry(), fs, getEntityRegistry(), { getSupabaseTableName, getEntityMapping }, inferFieldType(), inferTypeFromValue() (+9 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (11): StudentProgressRow(), cn(), AssessmentResultCard(), LearningMaterialCard(), UpcomingBatchCard(), StatsCard(), StatusBadge(), statusStyles (+3 more)

### Community 7 - "Community 7"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 8 - "Community 8"
Cohesion: 0.11
Nodes (17): compilerOptions, allowSyntheticDefaultImports, baseUrl, checkJs, esModuleInterop, jsx, lib, module (+9 more)

### Community 9 - "Community 9"
Cohesion: 0.12
Nodes (16): 10. `feedback`, 11. `certificates`, 1. `users_profile`, 2. `organizations`, 3. `programs`, 4. `batches`, 5. `enrollments` (Registrations), 6. `invoices` & `payments` (+8 more)

### Community 10 - "Community 10"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 11 - "Community 11"
Cohesion: 0.13
Nodes (14): API Design Summary, API Rules, API Style, Assessments, Attendance, Auth, Batches, Completion and Certificates (+6 more)

### Community 12 - "Community 12"
Cohesion: 0.13
Nodes (8): useAuth(), MyAssessments(), MyCertificates(), MyPrograms(), ParticipantDashboard(), Profile(), TrainerBatches(), TrainerFeedback()

### Community 13 - "Community 13"
Cohesion: 0.20
Nodes (5): isAdminRole(), ROLE_HOME_PATHS, ScrollToTop(), PageNotFound(), AuthenticatedApp()

### Community 14 - "Community 14"
Cohesion: 0.17
Nodes (11): Application Architecture, Authentication, Authorization, Certificate Eligibility, Current MVP, Data Access Layer, Domain Layer, Overview (+3 more)

### Community 15 - "Community 15"
Cohesion: 0.25
Nodes (9): actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners, memoryState, reducer(), toast() (+1 more)

### Community 16 - "Community 16"
Cohesion: 0.38
Nodes (8): {
  readAndParseSchema,
  parseTableDefinition,
  parseColumnDefinition,
  parseEnumValuesFromConstraint,
}, fs, getSchemaRegistry(), parseColumnDefinition(), parseEnumValuesFromConstraint(), parseTableDefinition(), path, readAndParseSchema()

### Community 17 - "Community 17"
Cohesion: 0.20
Nodes (8): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut()

### Community 18 - "Community 18"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 19 - "Community 19"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 20 - "Community 20"
Cohesion: 0.20
Nodes (7): FormControl, FormDescription, FormFieldContext, FormItem, FormItemContext, FormLabel, FormMessage

### Community 21 - "Community 21"
Cohesion: 0.22
Nodes (8): Auth, Build, Project Structure, Run Locally, Supabase Mode, Tech Stack, V-TEKI Institute Platform, What You Can Do

### Community 22 - "Community 22"
Cohesion: 0.25
Nodes (5): TrainerAssessments(), formatSafeDate(), TrainerAttendance(), TrainerDashboard(), resolveTrainerRecord()

### Community 23 - "Community 23"
Cohesion: 0.22
Nodes (8): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle

### Community 24 - "Community 24"
Cohesion: 0.22
Nodes (5): ChartContainer, ChartContext, ChartLegendContent, ChartTooltipContent, THEMES

### Community 25 - "Community 25"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 26 - "Community 26"
Cohesion: 0.25
Nodes (4): CorporateDashboard(), CorporateInvoices(), CorporateParticipants(), resolveCorporateOrganizationName()

### Community 27 - "Community 27"
Cohesion: 0.25
Nodes (7): Development Plan, Immediate Next Steps, Phase 1: Stabilize Shared Business Rules, Phase 2: Complete Operational MVP Modules, Phase 3: Complete Role Flows, Phase 4: Demo Stability and Polish, Phase 5: Future Migration Path

### Community 28 - "Community 28"
Cohesion: 0.25
Nodes (7): Current Direction, Features Still In Progress, Known Notes, Project Progress, Recent Fixes, Recommended Next Steps, What Is Already Working

### Community 29 - "Community 29"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 30 - "Community 30"
Cohesion: 0.25
Nodes (6): Carousel, CarouselContent, CarouselContext, CarouselItem, CarouselNext, CarouselPrevious

### Community 31 - "Community 31"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 32 - "Community 32"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 33 - "Community 33"
Cohesion: 0.25
Nodes (7): SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger

### Community 34 - "Community 34"
Cohesion: 0.25
Nodes (7): SheetContent, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

### Community 35 - "Community 35"
Cohesion: 0.25
Nodes (7): Toast, ToastAction, ToastClose, ToastDescription, ToastTitle, toastVariants, ToastViewport

### Community 36 - "Community 36"
Cohesion: 0.29
Nodes (6): Current Setup, Future Migration Notes, Summary, Supabase Integration Status, What Is Active In The Demo, What Is Not Active In The Demo

### Community 37 - "Community 37"
Cohesion: 0.29
Nodes (6): Done, In Progress, Later, Next Up, Recently Updated, Task List

### Community 38 - "Community 38"
Cohesion: 0.29
Nodes (6): Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle

### Community 39 - "Community 39"
Cohesion: 0.29
Nodes (6): DialogContent, DialogDescription, DialogFooter(), DialogHeader(), DialogOverlay, DialogTitle

### Community 40 - "Community 40"
Cohesion: 0.29
Nodes (6): Pagination(), PaginationContent, PaginationEllipsis(), PaginationItem, PaginationNext(), PaginationPrevious()

### Community 41 - "Community 41"
Cohesion: 0.33
Nodes (5): Current Frontend Structure, Folder Structure, Future Backend Structure, Recommended Frontend Structure, Structure Guidelines

### Community 42 - "Community 42"
Cohesion: 0.33
Nodes (5): Current Runtime Contract, Implementation Summary, Notes, Recent Stability Work, What Is Working

### Community 43 - "Community 43"
Cohesion: 0.33
Nodes (4): fadeUp, features, programTypes, stats

### Community 44 - "Community 44"
Cohesion: 0.33
Nodes (4): Button, buttonVariants, Calendar(), PaginationLink()

### Community 45 - "Community 45"
Cohesion: 0.40
Nodes (4): Current Build Direction, Future Build Direction, Implementation Blueprint, Practical Rule

### Community 46 - "Community 46"
Cohesion: 0.40
Nodes (4): Current Status, Implementation Complete, Keep In Mind, Remaining Work

### Community 47 - "Community 47"
Cohesion: 0.50
Nodes (3): DashboardLayout(), navGroups, Sidebar()

### Community 48 - "Community 48"
Cohesion: 0.40
Nodes (3): levelLabels, modeLabels, typeLabels

### Community 49 - "Community 49"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 50 - "Community 50"
Cohesion: 0.40
Nodes (4): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot

### Community 51 - "Community 51"
Cohesion: 0.50
Nodes (3): modeLabels, ProgramDetail(), typeLabels

### Community 52 - "Community 52"
Cohesion: 0.50
Nodes (3): AccordionContent, AccordionItem, AccordionTrigger

### Community 53 - "Community 53"
Cohesion: 0.50
Nodes (3): Avatar, AvatarFallback, AvatarImage

### Community 54 - "Community 54"
Cohesion: 0.50
Nodes (3): TabsContent, TabsList, TabsTrigger

### Community 55 - "Community 55"
Cohesion: 0.50
Nodes (3): ToggleGroup, ToggleGroupContext, ToggleGroupItem

## Knowledge Gaps
- **433 isolated node(s):** `supabase`, `supabase`, `supabase`, `$schema`, `style` (+428 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **30 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 6` to `Community 34`, `Community 69`, `Community 39`, `Community 40`, `Community 10`, `Community 44`, `Community 47`, `Community 17`, `Community 18`, `Community 19`, `Community 23`, `Community 29`, `Community 31`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Community 12` to `Community 64`, `Community 1`, `Community 66`, `Community 67`, `Community 68`, `Community 13`, `Community 47`, `Community 51`, `Community 22`, `Community 56`, `Community 26`, `Community 62`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `Sidebar()` connect `Community 47` to `Community 6`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Are the 31 inferred relationships involving `cn()` (e.g. with `StudentProgressRow()` and `Sidebar()`) actually correct?**
  _`cn()` has 31 INFERRED edges - model-reasoned connections that need verification._
- **Are the 25 inferred relationships involving `useAuth()` (e.g. with `AdminAssessmentQuestions()` and `ProtectedRoute()`) actually correct?**
  _`useAuth()` has 25 INFERRED edges - model-reasoned connections that need verification._
- **Are the 22 inferred relationships involving `useToast()` (e.g. with `AdminAssessmentQuestions()` and `AdminAssessments()`) actually correct?**
  _`useToast()` has 22 INFERRED edges - model-reasoned connections that need verification._
- **What connects `supabase`, `supabase`, `supabase` to the rest of the system?**
  _433 weakly-connected nodes found - possible documentation gaps or missing edges._