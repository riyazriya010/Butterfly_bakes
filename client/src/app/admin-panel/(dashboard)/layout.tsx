import AdminSidebar from "@/src/components/admin/AdminSideBar";


export default function AdminPanelLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-amber-50/30 dark:bg-stone-950">
            <AdminSidebar />

            {/* Main Content */}
            <main className="lg:ml-[250px] min-h-screen">
                {children}
            </main>
        </div>
    );
}