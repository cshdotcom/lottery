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
import { Loader2, Plus, Pencil, Trash2, Settings, Gift, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ApiConfig {
  id: string;
  name: string;
  baseUrl: string;
}

interface LotteryConfig {
  id: string;
  name: string;
  description?: string;
  winnersCount: number;
  requireLevel: boolean;
  requireLevelMin: number;
  autoPost: boolean;
  postCategory: string;
  apiConfigId?: string;
  apiConfig?: ApiConfig;
  createdAt: string;
}

export default function LotteryConfigsPage() {
  const [configs, setConfigs] = useState<LotteryConfig[]>([]);
  const [apiConfigs, setApiConfigs] = useState<ApiConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<LotteryConfig | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    winnersCount: 1,
    requireLevel: false,
    requireLevelMin: 1,
    autoPost: false,
    postCategory: 'announcements',
    apiConfigId: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [configsRes, apiConfigsRes] = await Promise.all([
        fetch('/api/admin/lottery-configs'),
        fetch('/api/admin/api-configs'),
      ]);
      const configsData = await configsRes.json();
      const apiConfigsData = await apiConfigsRes.json();
      setConfigs(configsData);
      setApiConfigs(apiConfigsData.filter((c: ApiConfig) => c.isActive));
    } catch (error) {
      toast.error('获取数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingConfig 
        ? `/api/admin/lottery-configs/${editingConfig.id}` 
        : '/api/admin/lottery-configs';
      const method = editingConfig ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          apiConfigId: formData.apiConfigId || null,
        }),
      });

      if (!response.ok) {
        throw new Error('保存失败');
      }

      toast.success(editingConfig ? '配置已更新' : '配置已创建');
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('保存失败');
    }
  };

  const handleEdit = (config: LotteryConfig) => {
    setEditingConfig(config);
    setFormData({
      name: config.name,
      description: config.description || '',
      winnersCount: config.winnersCount,
      requireLevel: config.requireLevel,
      requireLevelMin: config.requireLevelMin,
      autoPost: config.autoPost,
      postCategory: config.postCategory,
      apiConfigId: config.apiConfigId || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此配置吗？')) return;

    try {
      const response = await fetch(`/api/admin/lottery-configs/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('删除失败');
      }

      toast.success('配置已删除');
      fetchData();
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const resetForm = () => {
    setEditingConfig(null);
    setFormData({
      name: '',
      description: '',
      winnersCount: 1,
      requireLevel: false,
      requireLevelMin: 1,
      autoPost: false,
      postCategory: 'announcements',
      apiConfigId: '',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Settings className="h-8 w-8" />
              抽奖配置管理
            </h1>
            <p className="text-muted-foreground mt-1">预设抽奖参数和自动发帖规则</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                添加配置
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingConfig ? '编辑抽奖配置' : '添加抽奖配置'}
                </DialogTitle>
                <DialogDescription>
                  设置预设的抽奖参数
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">配置名称</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="普通抽奖"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="winnersCount">默认中奖人数</Label>
                      <Input
                        id="winnersCount"
                        type="number"
                        min={1}
                        value={formData.winnersCount}
                        onChange={(e) => setFormData({ ...formData, winnersCount: parseInt(e.target.value) || 1 })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="postCategory">发帖分类</Label>
                      <Select
                        value={formData.postCategory}
                        onValueChange={(value) => setFormData({ ...formData, postCategory: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="announcements">公告</SelectItem>
                          <SelectItem value="general">综合</SelectItem>
                          <SelectItem value="random">随机</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>API 配置</Label>
                      <Select
                        value={formData.apiConfigId}
                        onValueChange={(value) => setFormData({ ...formData, apiConfigId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择 API 配置" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">不使用</SelectItem>
                          {apiConfigs.map((config) => (
                            <SelectItem key={config.id} value={config.id}>
                              {config.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="requireLevel"
                      checked={formData.requireLevel}
                      onCheckedChange={(checked) => setFormData({ ...formData, requireLevel: checked })}
                    />
                    <Label htmlFor="requireLevel">要求最低等级</Label>
                  </div>

                  {formData.requireLevel && (
                    <div className="space-y-2">
                      <Label htmlFor="requireLevelMin">最低等级要求</Label>
                      <Input
                        id="requireLevelMin"
                        type="number"
                        min={0}
                        value={formData.requireLevelMin}
                        onChange={(e) => setFormData({ ...formData, requireLevelMin: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoPost"
                      checked={formData.autoPost}
                      onCheckedChange={(checked) => setFormData({ ...formData, autoPost: checked })}
                    />
                    <Label htmlFor="autoPost">自动发帖公布结果</Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">描述（可选）</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="配置描述..."
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    取消
                  </Button>
                  <Button type="submit">
                    {editingConfig ? '保存更改' : '创建配置'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              抽奖配置列表
            </CardTitle>
            <CardDescription>
              已配置 {configs.length} 个抽奖预设
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>配置名称</TableHead>
                  <TableHead>中奖人数</TableHead>
                  <TableHead>等级要求</TableHead>
                  <TableHead>自动发帖</TableHead>
                  <TableHead>API 配置</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell className="font-medium">{config.name}</TableCell>
                    <TableCell>{config.winnersCount} 人</TableCell>
                    <TableCell>
                      {config.requireLevel ? (
                        <Badge variant="outline">Level {config.requireLevelMin}+</Badge>
                      ) : (
                        <Badge variant="secondary">无</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {config.autoPost ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          启用
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="mr-1 h-3 w-3" />
                          禁用
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {config.apiConfig?.name || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(config)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(config.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {configs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      暂无配置，点击上方按钮添加
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
