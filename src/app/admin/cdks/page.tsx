'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Pencil, Trash2, Key, Copy, CheckCircle2, XCircle, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Cdk {
  id: string;
  code: string;
  name: string;
  description?: string;
  cdkType: string;
  maxUses: number;
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
  createdBy?: string;
  apiConfig?: { name: string; baseUrl: string };
  usages: Array<{ id: string; username: string; usedAt: string }>;
}

interface ApiConfig {
  id: string;
  name: string;
  baseUrl: string;
}

export default function CdkManagementPage() {
  const [cdks, setCdks] = useState<Cdk[]>([]);
  const [apiConfigs, setApiConfigs] = useState<ApiConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingCdk, setEditingCdk] = useState<Cdk | null>(null);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    cdkType: 'lottery',
    maxUses: 1,
    expiresAt: '',
    apiConfigId: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [cdksRes, apiConfigsRes] = await Promise.all([
        fetch('/api/admin/cdks'),
        fetch('/api/admin/api-configs'),
      ]);
      const cdksData = await cdksRes.json();
      const apiConfigsData = await apiConfigsRes.json();
      setCdks(cdksData);
      setApiConfigs(apiConfigsData.filter((c: ApiConfig) => c.isActive));
    } catch (error) {
      toast.error('获取数据失败');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      const url = editingCdk 
        ? `/api/admin/cdks/${editingCdk.id}` 
        : '/api/admin/cdks';
      const method = editingCdk ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          maxUses: parseInt(formData.maxUses as unknown as string) || 1,
          expiresAt: formData.expiresAt || null,
          apiConfigId: formData.apiConfigId || null,
        }),
      });

      if (!response.ok) throw new Error('保存失败');
      toast.success(editingCdk ? 'CDK已更新' : 'CDK已创建');
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('保存失败');
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/admin/cdks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: parseInt(formData.maxUses as unknown as string) || 10,
          prefix: 'LOT',
          apiConfigId: formData.apiConfigId || null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedCodes(data.codes);
        toast.success(`成功生成 ${data.count} 个CDK`);
        fetchData();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error('批量生成失败');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleBatchGenerate(e: React.FormEvent) {
    e.preventDefault();
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/admin/cdks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: parseInt(formData.maxUses as unknown as string) || 10,
          prefix: 'LOT',
          apiConfigId: formData.apiConfigId || null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedCodes(data.codes);
        toast.success(`成功生成 ${data.count} 个CDK`);
        fetchData();
      }
    } catch (error) {
      toast.error('批量生成失败');
    } finally {
      setIsGenerating(false);
    }
  }

  function handleEdit(cdk: Cdk) {
    setEditingCdk(cdk);
    setFormData({
      code: cdk.code,
      name: cdk.name,
      description: cdk.description || '',
      cdkType: cdk.cdkType,
      maxUses: cdk.maxUses,
      expiresAt: cdk.expiresAt ? cdk.expiresAt.split('T')[0] : '',
      apiConfigId: '',
    });
    setIsDialogOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm('确定要删除此CDK吗？')) return;
    try {
      await fetch(`/api/admin/cdks/${id}`, { method: 'DELETE' });
      toast.success('CDK已删除');
      fetchData();
    } catch (error) {
      toast.error('删除失败');
    }
  }

  async function handleToggleActive(cdk: Cdk) {
    try {
      await fetch(`/api/admin/cdks/${cdk.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...cdk, isActive: !cdk.isActive }),
      });
      toast.success(cdk.isActive ? 'CDK已禁用' : 'CDK已启用');
      fetchData();
    } catch (error) {
      toast.error('操作失败');
    }
  }

  function copyCodes() {
    navigator.clipboard.writeText(generatedCodes.join('\n'));
    toast.success('已复制到剪贴板');
  }

  function resetForm() {
    setEditingCdk(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      cdkType: 'lottery',
      maxUses: 1,
      expiresAt: '',
      apiConfigId: '',
    });
    setGeneratedCodes([]);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Key className="h-8 w-8" />
              CDK 管理
            </h1>
            <p className="text-muted-foreground mt-1">管理兑换码和批量生成</p>
          </div>
          
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  批量生成
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>批量生成CDK</DialogTitle>
                  <DialogDescription>一次性生成多个CDK</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleBatchGenerate}>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>生成数量</Label>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={formData.maxUses}
                        onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    {apiConfigs.length > 0 && (
                      <div className="space-y-2">
                        <Label>关联站点（可选）</Label>
                        <Select value={formData.apiConfigId} onValueChange={(v) => setFormData({ ...formData, apiConfigId: v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="不关联" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">不关联</SelectItem>
                            {apiConfigs.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isGenerating}>
                      {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                      生成 {formData.maxUses} 个
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  添加CDK
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingCdk ? '编辑CDK' : '添加CDK'}</DialogTitle>
                  <DialogDescription>创建单个CDK</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>CDK代码</Label>
                      <Input
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="输入CDK代码"
                        disabled={!!editingCdk}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>名称</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="CDK名称"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>类型</Label>
                      <Select value={formData.cdkType} onValueChange={(v) => setFormData({ ...formData, cdkType: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lottery">抽奖</SelectItem>
                          <SelectItem value="vip">VIP</SelectItem>
                          <SelectItem value="custom">自定义</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>最大使用次数</Label>
                        <Input
                          type="number"
                          min={1}
                          value={formData.maxUses}
                          onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>过期日期</Label>
                        <Input
                          type="date"
                          value={formData.expiresAt}
                          onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>描述</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="CDK描述..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
                    <Button type="submit">{editingCdk ? '保存更改' : '创建'}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {generatedCodes.length > 0 && (
          <Card className="border-green-500">
            <CardHeader>
              <CardTitle className="text-green-600 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                生成的CDK ({generatedCodes.length}个)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea value={generatedCodes.join('\n')} readOnly className="font-mono text-sm mb-4" />
              <div className="flex gap-2">
                <Button onClick={copyCodes}><Copy className="mr-2 h-4 w-4" />复制全部</Button>
                <Button variant="outline" onClick={() => setGeneratedCodes([])}><RefreshCw className="mr-2 h-4 w-4" />清空</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>CDK列表</CardTitle>
            <CardDescription>共 {cdks.length} 个CDK</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CDK代码</TableHead>
                  <TableHead>名称</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>使用情况</TableHead>
                  <TableHead>过期时间</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cdks.map((cdk) => (
                  <TableRow key={cdk.id}>
                    <TableCell className="font-mono text-sm">{cdk.code}</TableCell>
                    <TableCell className="font-medium">{cdk.name}</TableCell>
                    <TableCell><Badge variant="outline">{cdk.cdkType}</Badge></TableCell>
                    <TableCell>
                      <span className={cdk.usedCount >= cdk.maxUses ? 'text-red-600' : ''}>
                        {cdk.usedCount} / {cdk.maxUses}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {cdk.expiresAt ? new Date(cdk.expiresAt).toLocaleDateString() : '永不过期'}
                    </TableCell>
                    <TableCell>
                      {cdk.isActive ? (
                        <Badge className="bg-green-500"><CheckCircle2 className="mr-1 h-3 w-3" />启用</Badge>
                      ) : (
                        <Badge variant="secondary"><XCircle className="mr-1 h-3 w-3" />禁用</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(cdk.code)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleToggleActive(cdk)}>
                          {cdk.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(cdk)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(cdk.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {cdks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      暂无CDK，点击上方按钮添加
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
