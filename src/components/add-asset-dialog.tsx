"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2, CheckCircle, Car, Dog, Home, User, Package } from "lucide-react";
import { addAsset } from "@/app/actions/asset";
import Link from "next/link";

type AssetType = "CAR" | "PET" | "HOME" | "PERSON" | "ASSET";

interface AddAssetDialogProps {
    plan?: string;
    isFreeTagEligible?: boolean;
}

const assetTypes: { type: AssetType; icon: any; label: string; desc: string }[] = [
    { type: "CAR", icon: Car, label: "Vehicle", desc: "Car, truck, motorcycle" },
    { type: "PET", icon: Dog, label: "Pet", desc: "Dog, cat, any pet" },
    { type: "HOME", icon: Home, label: "Home", desc: "Apartment, house, office" },
    { type: "PERSON", icon: User, label: "Person", desc: "Kid, elderly, family" },
    { type: "ASSET", icon: Package, label: "Asset", desc: "Bike, luggage, device" },
];

export function AddAssetDialog({ plan = "FREE", isFreeTagEligible = false }: AddAssetDialogProps) {
    const isFree = plan === "FREE" && !isFreeTagEligible;
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<1 | 2>(1); // 1=choose type, 2=fill form
    const [selectedType, setSelectedType] = useState<AssetType>("CAR");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const reset = () => {
        setStep(1);
        setSelectedType("CAR");
        setError(null);
        setSuccess(null);
    };

    async function handleSubmit(formData: FormData) {
        formData.set("type", selectedType);
        setLoading(true);
        setError(null);

        const result = await addAsset(formData);
        setLoading(false);

        if (result.success) {
            setSuccess(result.message);
            setTimeout(() => {
                setOpen(false);
                reset();
            }, 2000);
        } else {
            setError(result.message);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
            <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Asset
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg border-border bg-card">
                <DialogHeader>
                    <DialogTitle className="text-foreground">
                        {step === 1 ? "Choose Asset Type" : `Add ${selectedType === "CAR" ? "Vehicle" : selectedType.charAt(0) + selectedType.slice(1).toLowerCase()}`}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {step === 1 ? "What would you like to protect?" : "Fill in the details to generate a tag."}
                    </DialogDescription>
                </DialogHeader>

                {isFree ? (
                    <div className="py-12 flex flex-col items-center text-center space-y-6">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Plus className="h-8 w-8 text-primary" />
                        </div>
                        <div className="space-y-2 max-w-sm">
                            <h3 className="text-xl font-bold text-foreground">Subscription Required</h3>
                            <p className="text-muted-foreground">
                                To activate your first asset tag, you need to subscribe to the Standard Plan. 
                                Protect your vehicles, pets, and home today for just $24.99/year.
                            </p>
                        </div>
                        <Link href="/pricing" className="w-full">
                            <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all font-bold">
                                Activate Protection ($24.99)
                            </Button>
                        </Link>
                    </div>
                ) : success ? (
                    <div className="py-8 text-center space-y-4">
                        <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto" />
                        <p className="text-foreground font-medium">{success}</p>
                    </div>
                ) : step === 1 ? (
                    <div className="grid grid-cols-2 gap-3 py-4 sm:grid-cols-3">
                        {assetTypes.map(({ type, icon: Icon, label, desc }) => (
                            <button
                                key={type}
                                className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${selectedType === type
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border bg-card text-muted-foreground hover:border-primary/30"
                                    }`}
                                onClick={() => { setSelectedType(type); setStep(2); }}
                            >
                                <Icon className="h-6 w-6" />
                                <span className="text-sm font-semibold">{label}</span>
                                <span className="text-[10px] text-muted-foreground">{desc}</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        handleSubmit(formData);
                    }}>
                        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                            {error && (
                                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder={
                                        selectedType === "CAR" ? "e.g. Silver Camry" :
                                            selectedType === "PET" ? "e.g. Max" :
                                                selectedType === "HOME" ? "e.g. 123 Main St" :
                                                    selectedType === "PERSON" ? "e.g. Mom" :
                                                        "e.g. My Bike"
                                    }
                                    required
                                    className="bg-muted/50 border-border shadow-none focus-visible:ring-0 focus-visible:border-primary"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="subtitle">
                                    {selectedType === "CAR" ? "Model" :
                                        selectedType === "PET" ? "Breed" :
                                            selectedType === "HOME" ? "Unit/Apt" :
                                                selectedType === "PERSON" ? "Relationship" :
                                                    "Category"}
                                </Label>
                                <Input
                                    id="subtitle"
                                    name="subtitle"
                                    placeholder={
                                        selectedType === "CAR" ? "e.g. Camry, Civic" :
                                            selectedType === "PET" ? "e.g. Golden Retriever" :
                                                selectedType === "HOME" ? "e.g. Apt 4B" :
                                                    selectedType === "PERSON" ? "e.g. Daughter" :
                                                        "e.g. Bicycle"
                                    }
                                    className="bg-muted/50 border-border shadow-none focus-visible:ring-0 focus-visible:border-primary"
                                />
                            </div>

                            {/* Type-specific extra fields */}
                            {selectedType === "CAR" && (
                                <>

                                    <div className="space-y-2">
                                        <Label htmlFor="color">Color</Label>
                                        <Input id="color" name="color" placeholder="e.g. Silver" className="bg-muted/50 border-border" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="licensePlate">License Plate (Optional)</Label>
                                        <Input id="licensePlate" name="licensePlate" placeholder="ABC 1234" className="bg-muted/50 border-border" />
                                        <p className="text-xs text-muted-foreground">Stored encrypted. Only visible to you.</p>
                                    </div>
                                </>
                            )}

                            {selectedType === "PET" && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="species">Species</Label>
                                        <Input id="species" name="species" placeholder="e.g. Dog, Cat" className="bg-muted/50 border-border" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="microchipId">Microchip ID (Optional)</Label>
                                        <Input id="microchipId" name="microchipId" placeholder="Chip number" className="bg-muted/50 border-border" />
                                    </div>
                                </>
                            )}

                            {selectedType === "HOME" && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="address">Street Address</Label>
                                        <Input id="address" name="address" placeholder="123 Main St" className="bg-muted/50 border-border" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="city">City</Label>
                                            <Input id="city" name="city" placeholder="City" className="bg-muted/50 border-border" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="state">State</Label>
                                            <Input id="state" name="state" placeholder="State" className="bg-muted/50 border-border" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="zip">ZIP Code</Label>
                                        <Input id="zip" name="zip" placeholder="12345" className="bg-muted/50 border-border" />
                                    </div>
                                </>
                            )}

                            {selectedType === "PERSON" && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="age">Age (Optional)</Label>
                                        <Input id="age" name="age" placeholder="e.g. 12" type="number" className="bg-muted/50 border-border" />
                                    </div>
                                </>
                            )}

                            {selectedType === "ASSET" && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="serialNumber">Serial Number (Optional)</Label>
                                        <Input id="serialNumber" name="serialNumber" placeholder="S/N" className="bg-muted/50 border-border" />
                                    </div>
                                </>
                            )}
                        </div>

                        <DialogFooter className="mt-6 flex gap-3">
                            <Button type="button" variant="outline" onClick={() => setStep(1)} className="border-border">
                                Back
                            </Button>
                            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Asset"}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
