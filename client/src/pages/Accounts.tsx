import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2, Edit2, Plus } from "lucide-react";
import { toast } from "sonner";

export default function Accounts() {
  const { data: accounts = [], isLoading, refetch } = trpc.accounts.list.useQuery();
  const createMutation = trpc.accounts.create.useMutation();
  const updateMutation = trpc.accounts.update.useMutation();
  const deleteMutation = trpc.accounts.delete.useMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "Checking" as "Checking" | "Savings" | "Business" | "Credit Card",
    institution: "",
    color: "#3b82f6",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          ...formData,
        });
        toast.success("Account updated successfully");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("Account created successfully");
      }

      setFormData({ name: "", type: "Checking", institution: "", color: "#3b82f6" });
      setShowForm(false);
      setEditingId(null);
      refetch();
    } catch (error) {
      toast.error("Failed to save account");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteMutation.mutateAsync({ id: deleteId });
      toast.success("Account deleted successfully");
      setDeleteId(null);
      refetch();
    } catch (error) {
      toast.error("Failed to delete account");
    }
  };

  const handleEdit = (account: any) => {
    setFormData({
      name: account.name,
      type: account.type,
      institution: account.institution,
      color: account.color,
    });
    setEditingId(account.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: "", type: "Checking", institution: "", color: "#3b82f6" });
  };

  if (isLoading) {
    return <div className="p-6">Loading accounts...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Accounts</h1>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Account
          </Button>
        )}
      </div>

      {accounts.length === 0 && !showForm && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">No accounts yet. Create your first account to get started.</p>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Account
          </Button>
        </Card>
      )}

      {showForm && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">{editingId ? "Edit Account" : "New Account"}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Account Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., My Checking Account"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Account Type</label>
              <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Checking">Checking</SelectItem>
                  <SelectItem value="Savings">Savings</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Bank/Institution</label>
              <Input
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                placeholder="e.g., Wells Fargo"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? "Update Account" : "Create Account"}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account: any) => (
          <Card key={account.id} className="p-6" style={{ borderLeft: `4px solid ${account.color}` }}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">{account.name}</h3>
                <p className="text-sm text-muted-foreground">{account.institution}</p>
                <p className="text-xs text-muted-foreground mt-1">{account.type}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEdit(account)}
                  className="p-1 h-auto"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeleteId(account.id)}
                  className="p-1 h-auto text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div
              className="w-8 h-8 rounded"
              style={{ backgroundColor: account.color }}
            />
          </Card>
        ))}
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Account</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this account? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
