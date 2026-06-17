'use client';

import { db } from '@/lib/api-client';

import React, { useState } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Building2, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';
import RoleGuard from '@/components/layout/RoleGuard';

function AdminOrganizersContent() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    organization_name: '', contact_name: '', phone: '', email: '',
    disbursement_method: 'momo', momo_network: 'mtn', momo_number: '',
    bank_name: '', bank_account_number: '', bank_account_name: '',
  });

  const { data: organizers = [] } = useQuery({
    queryKey: ['admin-organizers'],
    queryFn: () => db.entities.Organizer.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.Organizer.create({ ...data, is_active: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizers'] });
      setDialogOpen(false);
      setForm({ organization_name: '', contact_name: '', phone: '', email: '', disbursement_method: 'momo', momo_network: 'mtn', momo_number: '', bank_name: '', bank_account_number: '', bank_account_name: '' });
      toast.success('Organizer created');
    },
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-black">Organizers</h1>
          <p className="text-sm text-muted-foreground">Manage event organizers</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gold-gradient text-white border-0 font-semibold gap-2">
              <Plus className="w-4 h-4" /> Add Organizer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>New Organizer</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <Label>Organization Name</Label>
                <Input value={form.organization_name} onChange={e => setForm({...form, organization_name: e.target.value})} />
              </div>
              <div>
                <Label>Contact Name</Label>
                <Input value={form.contact_name} onChange={e => setForm({...form, contact_name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                </div>
              </div>
              <div>
                <Label>Disbursement Method</Label>
                <Select value={form.disbursement_method} onValueChange={v => setForm({...form, disbursement_method: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="momo">Mobile Money</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.disbursement_method === 'momo' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Network</Label>
                    <Select value={form.momo_network} onValueChange={v => setForm({...form, momo_network: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mtn">MTN</SelectItem>
                        <SelectItem value="telecel">Telecel</SelectItem>
                        <SelectItem value="airteltigo">AirtelTigo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>MoMo Number</Label>
                    <Input value={form.momo_number} onChange={e => setForm({...form, momo_number: e.target.value})} />
                  </div>
                </div>
              )}
              {form.disbursement_method === 'bank' && (
                <>
                  <div><Label>Bank Name</Label><Input value={form.bank_name} onChange={e => setForm({...form, bank_name: e.target.value})} /></div>
                  <div><Label>Account Number</Label><Input value={form.bank_account_number} onChange={e => setForm({...form, bank_account_number: e.target.value})} /></div>
                  <div><Label>Account Name</Label><Input value={form.bank_account_name} onChange={e => setForm({...form, bank_account_name: e.target.value})} /></div>
                </>
              )}
              <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} className="w-full gold-gradient text-white border-0">
                Create Organizer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Organization</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Disbursement</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizers.map(org => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">{org.organization_name}</TableCell>
                  <TableCell>{org.contact_name}</TableCell>
                  <TableCell>{org.phone}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize text-xs">
                      {org.disbursement_method === 'momo' ? `MoMo (${org.momo_network})` : 'Bank'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={org.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}>
                      {org.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
export default function AdminOrganizersPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <AdminOrganizersContent />
    </RoleGuard>
  );
}
