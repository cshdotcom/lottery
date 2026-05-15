'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Key, CheckCircle2, XCircle, User, Shield, Clock, MessageSquare, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function CdkPage() {
  const [cdk, setCdk] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [hasUsed, setHasUsed] = useState(false);

  async function checkCdk() {
    if (!cdk.trim()) {
      toast.error('请输入CDK');
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const response = await fetch(`/api/cdk/validate?code=${encodeURIComponent(cdk.trim())}`);
      const data = await response.json();

      if (data.valid) {
        setValidationResult({
          valid: true,
          name: data.name,
          description: data.description,
          remainingUses: data.remainingUses,
        });
        toast.success('CDK有效');
      } else {
        setValidationResult({
          valid: false,
          error: data.error,
        });
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('验证失败');
    } finally {
      setIsValidating(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Key className="h-8 w-8" />
            CDK 验证
          </h1>
          <p className="text-muted-foreground mt-2">输入兑换码验证有效性</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>验证 CDK</CardTitle>
            <CardDescription>输入您的兑换码进行检查</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={cdk}
                onChange={(e) => setCdk(e.target.value.toUpperCase())}
                placeholder="输入CDK (如: LOT-XXXXXXXX)"
                className="font-mono"
                onKeyDown={(e) => e.key === 'Enter' && checkCdk()}
              />
              <Button onClick={checkCdk} disabled={isValidating}>
                {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : '验证'}
              </Button>
            </div>

            {validationResult && (
              <div className={`p-4 rounded-lg ${validationResult.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                {validationResult.valid ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-semibold">CDK有效</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">CDK名称:</span>
                        <span className="font-medium">{validationResult.name}</span>
                      </div>
                      {validationResult.description && (
                        <div>
                          <span className="text-sm text-muted-foreground">描述:</span>
                          <p className="text-sm mt-1">{validationResult.description}</p>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">剩余次数:</span>
                        <Badge variant="outline">{validationResult.remainingUses} 次</Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-5 w-5" />
                    <span className="font-semibold">{validationResult.error}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>使用说明</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Key className="h-4 w-4 mt-0.5" />
                <span>CDK区分大小写，请准确输入</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5" />
                <span>每个CDK有使用次数限制，用完即失效</span>
              </li>
              <li className="flex items-start gap-2">
                <Calendar className="h-4 w-4 mt-0.5" />
                <span>部分CDK有过期时间，请在有效期内使用</span>
              </li>
              <li className="flex items-start gap-2">
                <User className="h-4 w-4 mt-0.5" />
                <span>部分CDK可能绑定特定站点或用户</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
