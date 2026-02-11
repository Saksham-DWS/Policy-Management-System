import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar, } from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { api } from "@/lib/api";
import { useIsMobile } from "@/hooks/useMobile";
import { LayoutDashboard, LogOut, PanelLeft, Users, User, DollarSign, BarChart3, Shield, Settings, BookOpen, ClipboardCheck, Bell, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
const getMenuItems = (role, { showEmployeeManagement = false, showEmployeeApprovals = false } = {}) => {
    const items = [
        { icon: LayoutDashboard, label: "Dashboard", path: "/", roles: ['admin', 'hod', 'account', 'employee'] },
        { icon: User, label: "My Account", path: "/my-account", roles: ['employee'] },
        { icon: Users, label: "Employee Management", path: "/employees", roles: ['admin', 'hod'] },
        { icon: DollarSign, label: "Transactions", path: "/transactions", roles: ['admin', 'hod', 'employee'] },
        { icon: BarChart3, label: "Reports", path: "/reports", roles: ['admin', 'hod'] },
        { icon: Shield, label: "Audit Logs", path: "/audit-logs", roles: ['admin', 'hod'] },
        { icon: Settings, label: "User Management", path: "/user-management", roles: ['admin', 'hod'] },
        { icon: BookOpen, label: "Policies", path: "/policies", roles: ['admin', 'hod'] },
        { icon: ClipboardCheck, label: "Approvals", path: "/approvals", roles: ['admin', 'hod'] },
        { icon: DollarSign, label: "Accounts", path: "/accounts", roles: ['admin', 'account'] },
    ];
    return items.filter(
        item =>
            item.roles.includes(role) ||
            (item.path === "/employees" && showEmployeeManagement) ||
            (item.path === "/approvals" && showEmployeeApprovals),
    );
}; 
const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;
export default function DashboardLayout({ children, }) {
    const [sidebarWidth, setSidebarWidth] = useState(() => {
        const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
        return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
    });
    const { loading, user } = useAuth();
    useEffect(() => {
        localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
    }, [sidebarWidth]);
    if (loading) {
        return <DashboardLayoutSkeleton />;
    }
    if (!user) {
        return (<div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Sign in to continue
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Access to this dashboard requires authentication. Continue to launch the login flow.
            </p>
          </div>
          <Button onClick={() => {
                window.location.href = getLoginUrl();
            }} size="lg" className="w-full shadow-lg hover:shadow-xl transition-all">
            Sign in
          </Button>
        </div>
      </div>);
    }
    return (<SidebarProvider style={{
            "--sidebar-width": `${sidebarWidth}px`,
        }}>
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>);
}
function DashboardLayoutContent({ children, setSidebarWidth, }) {
    const { user, logout } = useAuth();
    const [location, setLocation] = useLocation();
    const { state, toggleSidebar } = useSidebar();
    const isCollapsed = state === "collapsed";
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = useRef(null);
    const isManager = user?.role === "admin" || user?.role === "hod";
    const { data: unreadData } = api.notifications.getUnreadCount.useQuery(undefined, {
        refetchInterval: 30000,
    });
    const { data: initiatorTeam } = api.team.getMyTeam.useQuery(undefined, {
        enabled: !!user && !isManager,
    });
    const canSeeEmployeeManagement = isManager || (initiatorTeam?.length ?? 0) > 0;
    const canSeeEmployeeApprovals = user?.role === "employee";
    const menuItems = getMenuItems(user?.role || 'user', {
        showEmployeeManagement: canSeeEmployeeManagement,
        showEmployeeApprovals: canSeeEmployeeApprovals,
    });
    const activeMenuItem = menuItems.find(item => item.path === location);
    const isMobile = useIsMobile();
    useEffect(() => {
        if (isCollapsed) {
            setIsResizing(false);
        }
    }, [isCollapsed]);
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing)
                return;
            const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
            const newWidth = e.clientX - sidebarLeft;
            if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
                setSidebarWidth(newWidth);
            }
        };
        const handleMouseUp = () => {
            setIsResizing(false);
        };
        if (isResizing) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
        }
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        };
    }, [isResizing, setSidebarWidth]);
    return (<>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r-0" disableTransition={isResizing}>
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button onClick={toggleSidebar} className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0" aria-label="Toggle navigation">
                <PanelLeft className="h-4 w-4 text-muted-foreground"/>
              </button>
              {!isCollapsed ? (<div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold tracking-tight truncate">
                    Navigation
                  </span>
                </div>) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-1">
              {menuItems.map((item) => {
            const isActive = location === item.path;
            return (<SidebarMenuItem key={item.path}>
                    <SidebarMenuButton isActive={isActive} onClick={() => setLocation(item.path)} tooltip={item.label} className={`h-10 transition-all font-normal`}>
                      <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}/>
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>);
        })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3">
            <div className="flex items-center gap-3 rounded-lg px-1 py-1 w-full group-data-[collapsible=icon]:justify-center">
              <Avatar className="h-9 w-9 border shrink-0">
                <AvatarFallback className="text-xs font-medium">
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                <p className="text-sm font-medium truncate leading-none">
                  {user?.name || "-"}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-1.5">
                  {user?.email || "-"}
                </p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        <div className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`} onMouseDown={() => {
            if (isCollapsed)
                return;
            setIsResizing(true);
        }} style={{ zIndex: 50 }}/>
      </div>

      <SidebarInset>
        <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
          <div className="flex h-14 items-center justify-between px-3 md:px-6">
            <div className="flex items-center gap-2">
              {isMobile ? (<SidebarTrigger className="h-9 w-9 rounded-lg bg-background"/>) : null}
              <div className="flex flex-col">
                <span className="tracking-tight text-foreground font-medium">
                  {activeMenuItem?.label ?? "Dashboard"}
                </span>
                <span className="text-xs text-muted-foreground hidden md:block">
                  {user?.name || user?.email}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative" onClick={() => setLocation("/notifications")}>
                <Bell className="h-5 w-5"/>
                {unreadData?.count ? (<span className="absolute -top-0.5 -right-0.5 h-4 min-w-[1rem] rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground flex items-center justify-center">
                    {unreadData.count > 99 ? "99+" : unreadData.count}
                  </span>) : null}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full border bg-background px-2 py-1.5 shadow-sm hover:bg-accent/50 transition-colors">
                    <Avatar className="h-8 w-8 border">
                      <AvatarFallback className="text-xs font-medium">
                        {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium hidden md:block">{user?.name || "Profile"}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground"/>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setLocation("/profile")} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4"/>
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4"/>
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
    </>);
}

