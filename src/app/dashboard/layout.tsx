import { auth } from "@/lib/auth";
import { NotificationListener } from "@/components/notification-listener";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    return (
        <>
            {children}
            {session?.user?.id && <NotificationListener />}
        </>
    );
}
