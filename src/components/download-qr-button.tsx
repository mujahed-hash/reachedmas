"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface DownloadQRButtonProps {
    shortCode: string;
    qrDataURL: string;
}

export function DownloadQRButton({ shortCode, qrDataURL }: DownloadQRButtonProps) {
    const handleDownload = () => {
        const link = document.createElement("a");
        link.href = qrDataURL;
        link.download = `smartsafe-tag-${shortCode}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Button
            onClick={handleDownload}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
            <Download className="h-4 w-4 mr-2" />
            Download QR Code
        </Button>
    );
}
