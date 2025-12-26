import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import "../styles/navbar.css";

type NavbarProps = {
    children?: React.ReactNode;
};

type NavItem = {
    to: string;
    label: string;
    icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactNode;
};

function IconMenu(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...props}>
            <path
                fill="currentColor"
                d="M4 6a1 1 0 1 1 0-2h16a1 1 0 1 1 0 2H4Zm0 7a1 1 0 1 1 0-2h16a1 1 0 1 1 0 2H4Zm0 7a1 1 0 1 1 0-2h16a1 1 0 1 1 0 2H4Z"
            />
        </svg>
    );
}

function IconChevronLeft(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...props}>
            <path
                fill="currentColor"
                d="M15.7 5.3a1 1 0 0 1 0 1.4L10.4 12l5.3 5.3a1 1 0 1 1-1.4 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.4 0Z"
            />
        </svg>
    );
}

function IconChevronRight(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...props}>
            <path
                fill="currentColor"
                d="M8.3 18.7a1 1 0 0 1 0-1.4l5.3-5.3-5.3-5.3a1 1 0 0 1 1.4-1.4l6 6a1 1 0 0 1 0 1.4l-6 6a1 1 0 0 1-1.4 0Z"
            />
        </svg>
    );
}

function IconHome(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...props}>
            <path
                fill="currentColor"
                d="M12 3.2a1 1 0 0 1 .7.3l8 7.3a1 1 0 1 1-1.4 1.5l-.9-.8V20a2 2 0 0 1-2 2h-2.5a1 1 0 0 1-1-1v-5.5h-2V21a1 1 0 0 1-1 1H7.6a2 2 0 0 1-2-2v-8.5l-.9.8a1 1 0 0 1-1.4-1.5l8-7.3a1 1 0 0 1 .7-.3Z"
            />
        </svg>
    );
}

function IconUser(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...props}>
            <path
                fill="currentColor"
                d="M12 12.2a4.6 4.6 0 1 0 0-9.2 4.6 4.6 0 0 0 0 9.2ZM4 21a7.9 7.9 0 0 1 16 0 1 1 0 1 1-2 0 5.9 5.9 0 0 0-12 0 1 1 0 1 1-2 0Z"
            />
        </svg>
    );
}

function IconSettings(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...props}>
            <path
                fill="currentColor"
                d="M19.4 13.5c.04-.5.04-1 0-1.5l1.6-1.2a1 1 0 0 0 .3-1.3l-1.6-2.8a1 1 0 0 0-1.2-.4l-1.9.8c-.4-.3-.9-.6-1.4-.8l-.3-2a1 1 0 0 0-1-.9h-3.2a1 1 0 0 0-1 .9l-.3 2c-.5.2-1 .5-1.4.8l-1.9-.8a1 1 0 0 0-1.2.4L2.7 9.2a1 1 0 0 0 .3 1.3l1.6 1.2c-.04.5-.04 1 0 1.5L3 14.7a1 1 0 0 0-.3 1.3l1.6 2.8a1 1 0 0 0 1.2.4l1.9-.8c.4.3.9.6 1.4.8l.3 2a1 1 0 0 0 1 .9h3.2a1 1 0 0 0 1-.9l.3-2c.5-.2 1-.5 1.4-.8l1.9.8a1 1 0 0 0 1.2-.4l1.6-2.8a1 1 0 0 0-.3-1.3l-1.6-1.2ZM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z"
            />
        </svg>
    );
}

const NAV_ITEMS: NavItem[] = [
    { to: "/app", label: "Dashboard", icon: (p) => <IconHome {...p} /> },
    { to: "/app/profile", label: "Profile", icon: (p) => <IconUser {...p} /> },
    { to: "/app/settings", label: "Settings", icon: (p) => <IconSettings {...p} /> },
];

export default function Navbar({ children }: NavbarProps) {
    const [isMobileOpen, setIsMobileOpen] = React.useState(false);
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    React.useEffect(() => {
        if (!isMobileOpen) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsMobileOpen(false);
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isMobileOpen]);

    const content = children ?? <Outlet />;

    return (
        <div className="appFrame">
            <div
                className={
                    "appOverlay" + (isMobileOpen ? " appOverlayOpen" : "")
                }
                onClick={() => setIsMobileOpen(false)}
                aria-hidden={!isMobileOpen}
            />

            <aside
                className={
                    "appSidebar" +
                    (isCollapsed ? " appSidebarCollapsed" : "") +
                    (isMobileOpen ? " appSidebarMobileOpen" : "")
                }
                aria-label="Sidebar"
            >
                <div className="appSidebarHeader">
                    <div className="appBrand" title="UniConnect">
                        <div className="appBrandMark" aria-hidden="true" />
                        <span className="appBrandText">UniConnect</span>
                    </div>

                    <button
                        type="button"
                        className="appIconBtn appCollapseBtn"
                        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                        aria-pressed={isCollapsed}
                        onClick={() => setIsCollapsed((v) => !v)}
                    >
                        {isCollapsed ? <IconChevronRight /> : <IconChevronLeft />}
                    </button>
                </div>

                <nav className="appNav" aria-label="Primary">
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === "/app"}
                            className={({ isActive }) =>
                                "appNavLink" + (isActive ? " appNavLinkActive" : "")
                            }
                            title={item.label}
                            onClick={() => setIsMobileOpen(false)}
                        >
                            <span className="appNavIcon" aria-hidden="true">
                                {item.icon({})}
                            </span>
                            <span className="appNavLabel">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </aside>

            <div className="appMain">
                <header className="appTopbar" aria-label="Top navigation">
                    <button
                        type="button"
                        className="appIconBtn appMobileMenuBtn"
                        aria-label="Open menu"
                        onClick={() => setIsMobileOpen(true)}
                    >
                        <IconMenu />
                    </button>
                    <div className="appTopbarTitle">UniConnect</div>
                </header>

                <main className="appContent" aria-label="Page content">
                    {content}
                </main>
            </div>
        </div>
    );
}