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
import { Plus, Loader2, Car, CheckCircle } from "lucide-react";
import { addVehicle } from "@/app/actions/vehicle";

export function AddVehicleDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);
        setSuccess(null);

        const result = await addVehicle(formData);

        setLoading(false);

        if (result.success) {
            setSuccess(result.message);
            // Close after short delay
            setTimeout(() => {
                setOpen(false);
                setSuccess(null);
            }, 2000);
        } else {
            setError(result.message);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Vehicle
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md border-border bg-card">
                <DialogHeader>
                    <DialogTitle className="text-foreground flex items-center gap-2">
                        <Car className="h-5 w-5 text-primary" />
                        Add New Vehicle
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Add a vehicle to generate a ReachMasked tag code.
                    </DialogDescription>
                </DialogHeader>

                {success ? (
                    <div className="py-8 text-center space-y-4">
                        <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto" />
                        <p className="text-foreground font-medium">{success}</p>
                    </div>
                ) : (
                    <form action={handleSubmit}>
                        <div className="space-y-4 py-4">
                            {error && (
                                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="model">Vehicle Model *</Label>
                                <Input
                                    id="model"
                                    name="model"
                                    placeholder="e.g. Toyota Camry, Honda Civic"
                                    required
                                    className="bg-muted/50 border-border"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="color">Color *</Label>
                                <Input
                                    id="color"
                                    name="color"
                                    placeholder="e.g. Silver, Black, White"
                                    required
                                    className="bg-muted/50 border-border"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="licensePlate">License Plate (Optional)</Label>
                                <Input
                                    id="licensePlate"
                                    name="licensePlate"
                                    placeholder="ABC 1234"
                                    className="bg-muted/50 border-border"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Stored encrypted. Only visible to you.
                                </p>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                className="border-border"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    "Add Vehicle"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
