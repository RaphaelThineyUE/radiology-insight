import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePatients } from '@/hooks/usePatients';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, User, Trash2, Edit, FileText, ClipboardList } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import type { Patient } from '@/types/radiology';

export default function Patients() {
  const { patients, loading, createPatient, updatePatient, deletePatient } = usePatients();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    medical_record_number: '',
    phone: '',
    email: '',
    address: ''
  });
  const { toast } = useToast();

  const filtered = patients.filter(p => 
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    p.medical_record_number?.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setForm({ first_name: '', last_name: '', date_of_birth: '', medical_record_number: '', phone: '', email: '', address: '' });
    setEditing(null);
  };

  const openEdit = (patient: Patient) => {
    setEditing(patient);
    setForm({
      first_name: patient.first_name,
      last_name: patient.last_name,
      date_of_birth: patient.date_of_birth || '',
      medical_record_number: patient.medical_record_number || '',
      phone: patient.phone || '',
      email: patient.email || '',
      address: patient.address || ''
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast({ title: 'Error', description: 'First and last name are required', variant: 'destructive' });
      return;
    }

    const patientData = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      date_of_birth: form.date_of_birth || null,
      medical_record_number: form.medical_record_number.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim() || null
    };

    if (editing) {
      const { error } = await updatePatient(editing.id, patientData);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Patient updated' });
        setDialogOpen(false);
        resetForm();
      }
    } else {
      const { error } = await createPatient(patientData);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Patient created' });
        setDialogOpen(false);
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await deletePatient(id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Patient removed' });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Patients</h1>
            <p className="text-muted-foreground mt-1">{patients.length} patients</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Add Patient</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit Patient' : 'New Patient'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input id="first_name" value={form.first_name} onChange={(e) => setForm(f => ({ ...f, first_name: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input id="last_name" value={form.last_name} onChange={(e) => setForm(f => ({ ...f, last_name: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input id="dob" type="date" value={form.date_of_birth} onChange={(e) => setForm(f => ({ ...f, date_of_birth: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mrn">MRN</Label>
                    <Input id="mrn" placeholder="Medical Record #" value={form.medical_record_number} onChange={(e) => setForm(f => ({ ...f, medical_record_number: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
                <Button onClick={handleSubmit}>{editing ? 'Update' : 'Create'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search patients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>

        {loading ? (
          <p className="text-muted-foreground text-center py-8">Loading...</p>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No patients found</p>
              <Button className="mt-4" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />Add your first patient
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filtered.map(patient => (
              <Card key={patient.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{patient.first_name} {patient.last_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {patient.medical_record_number && <span>MRN: {patient.medical_record_number}</span>}
                        {patient.date_of_birth && <span className="ml-2">DOB: {new Date(patient.date_of_birth).toLocaleDateString()}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/patient/${patient.id}`}><ClipboardList className="h-4 w-4" /></Link>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(patient)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(patient.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
